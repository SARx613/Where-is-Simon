import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().min(1),
  location: z.string().optional().default(''),
  description: z.string().optional().default(''),
  tier: z.enum(['starter', 'pro', 'premium']),
});
