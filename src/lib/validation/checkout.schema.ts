import { z } from 'zod';

export const checkoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.url(),
  cancelUrl: z.url(),
});
