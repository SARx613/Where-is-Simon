import { z } from 'zod';

export const processPhotoSchema = z.object({
  photoId: z.uuid(),
  imageUrl: z.url(),
});
