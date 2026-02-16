import { z } from 'zod';

export const processPhotoSchema = z.object({
  photoId: z.uuid(),
  imageUrl: z.url(),
  faces: z.array(
    z.object({
      embedding: z.array(z.number()).length(128),
      box_x: z.number().int(),
      box_y: z.number().int(),
      box_width: z.number().int().nonnegative(),
      box_height: z.number().int().nonnegative(),
    })
  ).optional().default([]),
});
