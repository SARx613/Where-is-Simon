import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';

// Patch face-api.js environment for Node.js
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any, ImageData: ImageData as any });
  console.log('[WhereIsSimon-DEBUG-SERVER] face-api.js env monkeyPatched successfully');
} catch (e) {
  console.warn("[WhereIsSimon-DEBUG-SERVER] Failed to monkeyPatch face-api.js env:", e);
}

// Helper to load models from disk (server-side)
const MODEL_PATH = path.join(process.cwd(), 'public/models');
let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) {
    console.log('[WhereIsSimon-DEBUG-SERVER] Models already loaded');
    return;
  }
  console.log('[WhereIsSimon-DEBUG-SERVER] Loading models from:', MODEL_PATH);

  // Use a timeout for model loading to prevent hangs
  const loadPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH)
  ]);

  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Model loading timeout")), 10000));

  await Promise.race([loadPromise, timeoutPromise]);

  modelsLoaded = true;
  console.log('[WhereIsSimon-DEBUG-SERVER] Models loaded successfully');
}

export async function POST(req: Request) {
  console.log('[WhereIsSimon-DEBUG-SERVER] Received POST request to /api/photos/process');

  let currentPhotoId: string | null = null;
  let supabaseAdmin: ReturnType<typeof createServerClient> | null = null;

  try {
    const { photoId, imageUrl } = await req.json();
    currentPhotoId = photoId;
    console.log('[WhereIsSimon-DEBUG-SERVER] Payload:', { photoId, imageUrl });

    if (!photoId || !imageUrl) {
      console.error('[WhereIsSimon-DEBUG-SERVER] Missing parameters');
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Initialize Supabase Server Client to forward auth cookies
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    supabaseAdmin = supabase; // Keep reference for error block

    // Verify User (Optional but good for debugging RLS)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.warn('[WhereIsSimon-DEBUG-SERVER] User not authenticated via cookies. RLS might fail if not using Service Role.', authError);
    } else {
        console.log('[WhereIsSimon-DEBUG-SERVER] Authenticated user:', user.id);
    }

    // Update status to processing
    console.log('[WhereIsSimon-DEBUG-SERVER] Updating photo status to processing...');
    const { error: updateError } = await supabase.from('photos').update({ status: 'processing' }).eq('id', photoId);

    if (updateError) {
       console.error('[WhereIsSimon-DEBUG-SERVER] Failed to update status to processing:', updateError);
       // Check specifically for column missing
       if (updateError.message.includes("Could not find the 'status' column")) {
         throw new Error("CRITICAL DB ERROR: Missing 'status' column. Please run migration script.");
       }
    }

    // Load models
    await loadModels();

    // Fetch image
    console.log('[WhereIsSimon-DEBUG-SERVER] Loading image from URL...');
    const img = await loadImage(imageUrl);
    console.log('[WhereIsSimon-DEBUG-SERVER] Image loaded. Dimensions:', img.width, 'x', img.height);

    // Detect faces with timeout
    console.log('[WhereIsSimon-DEBUG-SERVER] Detecting faces...');

    const detectionPromise = faceapi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .detectAllFaces(img as any, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const detectionTimeout = new Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>[]>((_, reject) =>
        setTimeout(() => reject(new Error("Face detection timeout")), 20000)
    );

    const detections = await Promise.race([detectionPromise, detectionTimeout]);

    console.log('[WhereIsSimon-DEBUG-SERVER] Faces detected:', detections.length);

    // Save faces
    if (detections.length > 0) {
      const faces = detections.map(d => ({
        photo_id: photoId,
        embedding: Array.from(d.descriptor),
        box_x: Math.round(d.detection.box.x),
        box_y: Math.round(d.detection.box.y),
        box_width: Math.round(d.detection.box.width),
        box_height: Math.round(d.detection.box.height)
      }));

      console.log('[WhereIsSimon-DEBUG-SERVER] Inserting faces into DB...');
      const { error: facesError } = await supabase.from('photo_faces').insert(faces);
      if (facesError) {
          console.error('[WhereIsSimon-DEBUG-SERVER] Failed to insert faces:', facesError);
          // Don't fail the whole process if just face insert fails? Or maybe yes.
          // Let's mark as ready but log error.
          // actually if face insert fails, maybe we should mark as error?
          throw new Error(`DB Error inserting faces: ${facesError.message}`);
      }
    }

    // Update status to ready
    console.log('[WhereIsSimon-DEBUG-SERVER] Updating photo status to ready...');
    await supabase.from('photos').update({ status: 'ready' }).eq('id', photoId);

    console.log('[WhereIsSimon-DEBUG-SERVER] Process complete for photo:', photoId);
    return NextResponse.json({ success: true, facesFound: detections.length });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhereIsSimon-DEBUG-SERVER] Processing Error:", error);

    // Try to update status to error to unblock UI
    if (currentPhotoId && supabaseAdmin) {
        try {
            console.log('[WhereIsSimon-DEBUG-SERVER] Setting photo status to error...');
            await supabaseAdmin.from('photos').update({ status: 'error' }).eq('id', currentPhotoId);
        } catch (e) {
            console.error('[WhereIsSimon-DEBUG-SERVER] Failed to set error status:', e);
        }
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
