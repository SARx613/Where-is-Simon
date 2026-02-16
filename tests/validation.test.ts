import { describe, expect, it } from 'vitest';
import { checkoutSchema } from '../src/lib/validation/checkout.schema';
import { processPhotoSchema } from '../src/lib/validation/photo.schema';
import { createEventSchema } from '../src/lib/validation/event.schema';

describe('validation schemas', () => {
  it('accepts a valid checkout payload', () => {
    const data = checkoutSchema.parse({
      priceId: 'price_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(data.priceId).toBe('price_123');
  });

  it('rejects invalid process photo payload', () => {
    expect(() =>
      processPhotoSchema.parse({
        photoId: 'not-a-uuid',
        imageUrl: 'invalid-url',
      })
    ).toThrow();
  });

  it('normalizes and validates create event payload', () => {
    const data = createEventSchema.parse({
      name: 'Mariage Alice Bob',
      slug: 'mariage-alice-bob',
      date: '2026-06-20',
      location: '',
      description: '',
      tier: 'starter',
    });
    expect(data.slug).toBe('mariage-alice-bob');
  });
});
