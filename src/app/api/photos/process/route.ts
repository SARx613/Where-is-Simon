import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { processPhotoSchema } from '@/lib/validation/photo.schema';
import { AppError, errorResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
const rateBucket = new Map<string, { count: number; windowStart: number }>();

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

export async function POST(req: Request) {
  let currentPhotoId: string | null = null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    const startedAt = Date.now();
    rateLimit(ip);
    const body = await req.json();
    const payload = processPhotoSchema.parse(body);
    currentPhotoId = payload.photoId;
    logger.info('Photo processing request received', {
      photoId: payload.photoId,
      facesFromClient: payload.faces.length,
      ip,
    });

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

    if (payload.faces.length > 0) {
      const faces = payload.faces.map((d) => ({
        photo_id: payload.photoId,
        embedding: d.embedding,
        box_x: d.box_x,
        box_y: d.box_y,
        box_width: d.box_width,
        box_height: d.box_height,
      }));

      const { error: insertError } = await supabase.from('photo_faces').insert(faces);
      if (insertError) throw new AppError(`Failed to save face embeddings: ${insertError.message}`, 500);
    }

    await supabase.from('photos').update({ status: 'ready' }).eq('id', payload.photoId);
    logger.info('Photo processing completed', {
      photoId: payload.photoId,
      facesStored: payload.faces.length,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ success: true, facesFound: payload.faces.length });
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
