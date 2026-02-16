import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutSchema } from '@/lib/validation/checkout.schema';
import { env } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError, errorResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = checkoutSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new AppError('Unauthorized', 401);

    const success = new URL(successUrl);
    const cancel = new URL(cancelUrl);
    if (success.origin !== cancel.origin) throw new AppError('Invalid redirect URLs', 400);
    if (!env.STRIPE_SECRET_KEY) throw new AppError('Missing STRIPE_SECRET_KEY', 500);

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: '2025-01-27.acacia' as any,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: authData.user.email,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    logger.error('Stripe checkout error', { err });
    return errorResponse(err);
  }
}
