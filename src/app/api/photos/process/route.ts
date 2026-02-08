import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';

// Patch face-api.js environment for Node.js
// Use try-catch to avoid issues in environments where canvas might not load properly or env check fails
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any, ImageData: ImageData as any });
} catch (e) {
  console.warn("Failed to monkeyPatch face-api.js env:", e);
}

// Helper to load models from disk (server-side)
const MODEL_PATH = path.join(process.cwd(), 'public/models');
let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
  modelsLoaded = true;
}

export async function POST(req: Request) {
  try {
    const { photoId, imageUrl } = await req.json();

    if (!photoId || !imageUrl) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Initialize Supabase Admin client (to bypass RLS for updates)
    // Using service role key would be best, but we'll try with anon + user session if passed,
    // or assume this is a trusted internal call.
    // For MVP, we use the public client but ideally this should be secured.
    const supabase = createClient();

    // Update status to processing
    await supabase.from('photos').update({ status: 'processing' }).eq('id', photoId);

    // Load models
    await loadModels();

    // Fetch image
    const img = await loadImage(imageUrl);

    // Detect faces
    const detections = await faceapi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .detectAllFaces(img as any, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

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

      await supabase.from('photo_faces').insert(faces);
    }

    // Update status to ready
    await supabase.from('photos').update({ status: 'ready' }).eq('id', photoId);

    return NextResponse.json({ success: true, facesFound: detections.length });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Processing Error:", error);
    // Try to update status to error
    // const supabase = createClient();
    // await supabase.from('photos').update({ status: 'error' }).eq('id', photoId);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
