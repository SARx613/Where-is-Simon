import { NextResponse } from 'next/server';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { processPhotoSchema } from '@/lib/validation/photo.schema';
import { AppError, errorResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { MODEL_LOAD_TIMEOUT_MS, PHOTO_PROCESS_TIMEOUT_MS } from '@/lib/constants';

const MODEL_PATH = path.join(process.cwd(), 'public/models');
const rateBucket = new Map<string, { count: number; windowStart: number }>();
let modelsLoaded = false;
let environmentPatched = false;

function rateLimit(ip: string) {
  const now = Date.now();
  const minute = 60_000;
  const limit = 30;
  const row = rateBucket.get(ip);
  if (!row || now - row.windowStart > minute) {
    rateBucket.set(ip, { count: 1, windowStart: now });
    return;
  }
  if (row.count >= limit) throw new AppError('Too many requests', 429);
  row.count += 1;
}

async function loadModels() {
  if (!environmentPatched) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any, ImageData: ImageData as any });
      environmentPatched = true;
    } catch (error) {
      throw new AppError(`face-api setup failed: ${error instanceof Error ? error.message : 'unknown error'}`, 500);
    }
  }

  if (modelsLoaded) return;
  const loadPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
  ]);
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new AppError('Model loading timeout', 504)), MODEL_LOAD_TIMEOUT_MS));
  await Promise.race([loadPromise, timeoutPromise]);
  modelsLoaded = true;
}

export async function POST(req: Request) {
  let currentPhotoId: string | null = null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    rateLimit(ip);
    const body = await req.json();
    const payload = processPhotoSchema.parse(body);
    currentPhotoId = payload.photoId;

    const imageHost = new URL(payload.imageUrl).hostname;
    const allowedHost = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    if (imageHost !== allowedHost) {
      throw new AppError('Invalid image host', 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new AppError('Unauthorized', 401);

    const { data: photoRowRaw, error: photoError } = await supabase
      .from('photos')
      .select('id,event_id')
      .eq('id', payload.photoId)
      .single();

    const photoRow = photoRowRaw as { id: string; event_id: string } | null;
    if (photoError || !photoRow) throw new AppError('Photo not found', 404);
    const { data: eventRowRaw, error: eventError } = await supabase
      .from('events')
      .select('photographer_id')
      .eq('id', photoRow.event_id)
      .single();
    const eventRow = eventRowRaw as { photographer_id: string } | null;
    if (eventError || !eventRow) throw new AppError('Event not found', 404);
    if (eventRow.photographer_id !== authData.user.id) throw new AppError('Forbidden', 403);

    const { error: statusError } = await supabase.from('photos').update({ status: 'processing' }).eq('id', payload.photoId);
    if (statusError) throw new AppError(`Failed to update status: ${statusError.message}`, 500);

    await loadModels();
    const img = await loadImage(payload.imageUrl);

    const detectionPromise = faceapi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .detectAllFaces(img as any, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();
    const detectionTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Face detection timeout', 504)), PHOTO_PROCESS_TIMEOUT_MS)
    );
    const detections = await Promise.race([detectionPromise, detectionTimeout]);

    if (detections.length > 0) {
      const faces = detections.map((d) => ({
        photo_id: payload.photoId,
        embedding: Array.from(d.descriptor),
        box_x: Math.round(d.detection.box.x),
        box_y: Math.round(d.detection.box.y),
        box_width: Math.round(d.detection.box.width),
        box_height: Math.round(d.detection.box.height),
      }));

      const { error: insertError } = await supabase.from('photo_faces').insert(faces);
      if (insertError) throw new AppError(`Failed to save face embeddings: ${insertError.message}`, 500);
    }

    await supabase.from('photos').update({ status: 'ready' }).eq('id', payload.photoId);
    return NextResponse.json({ success: true, facesFound: detections.length });
  } catch (error: unknown) {
    if (currentPhotoId) {
      try {
        const supabase = await createSupabaseServerClient();
        await supabase.from('photos').update({ status: 'error' }).eq('id', currentPhotoId);
      } catch (innerError) {
        logger.error('Failed to set error status', { innerError, currentPhotoId });
      }
    }
    logger.error('Photo processing failed', { error });
    return errorResponse(error);
  }
}
