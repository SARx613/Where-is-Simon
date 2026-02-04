import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use a placeholder key if env var is missing during build time to prevent build crash
// The actual key is needed at runtime.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }

    // In a real app, verify user session here
    // const supabase = createRouteHandlerClient(...)
    // const { data: { user } } = await supabase.auth.getUser()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // or 'payment' for one-time
      success_url: successUrl,
      cancel_url: cancelUrl,
      // customer_email: user.email // Pre-fill email
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
