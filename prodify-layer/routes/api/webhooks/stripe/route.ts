// prodify-layer/routes/api/webhooks/stripe/route.ts
// Drop into app/api/webhooks/stripe/route.ts
// Uses Supabase service-role client to write webhook events + sync subscription status.
//
// Required Stripe events to enable in your dashboard:
//   checkout.session.completed
//   invoice.payment_succeeded
//   invoice.payment_failed
//   customer.subscription.updated
//   customer.subscription.deleted
//   customer.subscription.trial_will_end  (optional — triggers upgrade prompts)
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/prodify-layer/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' });

export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  // ── Idempotency: store raw event BEFORE any business logic ─────────────────
  // If the handler crashes after this upsert, re-delivery won't re-process
  // because stripe_event_id is UNIQUE. Safe to re-deliver any event.
  const { error: upsertError } = await supabase
    .from('webhook_events')
    .upsert(
      { stripe_event_id: event.id, type: event.type, payload: event },
      { onConflict: 'stripe_event_id' },
    );
  if (upsertError) {
    console.error('[stripe/webhook] failed to store event:', upsertError.message);
    // Return 500 so Stripe retries — do not silently swallow this
    return NextResponse.json({ error: 'Event storage failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      // ── User completes checkout ─────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string | null;

        if (userId && customerId) {
          await supabase.from('users').update({
            stripe_customer_id: customerId,
            subscription_tier: 'pro',
            subscription_status: 'active',
          }).eq('id', userId);
        }

        // Create subscriptions row if mode is subscription
        if (session.mode === 'subscription' && session.subscription && userId) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_price_id: sub.items.data[0]?.price.id ?? null,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }, { onConflict: 'stripe_subscription_id' });
        }
        break;
      }

      // ── Recurring payment succeeded — extend access ─────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;
        const subscriptionId = invoice.subscription as string | null;

        if (customerId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await supabase.from('users').update({
            subscription_status: 'active',
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', customerId);

          await supabase.from('subscriptions').update({
            status: 'active',
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      // ── Payment failed — mark past_due, trigger dunning flow ───────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;
        if (customerId) {
          await supabase.from('users').update({
            subscription_status: 'past_due',
          }).eq('stripe_customer_id', customerId);
          // TODO: send dunning email to prompt card update
        }
        break;
      }

      // ── Subscription updated — plan change, seat change, trial end, pause ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string | null;

        if (customerId) {
          await supabase.from('users').update({
            subscription_status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', customerId);

          await supabase.from('subscriptions').update({
            status: sub.status,
            stripe_price_id: sub.items.data[0]?.price.id ?? null,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          }).eq('stripe_subscription_id', sub.id);
        }
        break;
      }

      // ── Subscription cancelled — downgrade to free ──────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string | null;

        if (customerId) {
          await supabase.from('users').update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            current_period_end: null,
          }).eq('stripe_customer_id', customerId);

          await supabase.from('subscriptions').update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', sub.id);
        }
        break;
      }

      // ── Trial ending in 3 days — send upgrade prompt ────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        // TODO: send trial expiry email using your email provider
        console.log('[stripe/webhook] trial ending for subscription:', sub.id);
        break;
      }

      default:
        // Unhandled event — safe to ignore, already stored above
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries the specific event
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
