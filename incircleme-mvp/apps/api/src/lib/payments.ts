import Stripe from 'stripe';
import { randomBytes } from 'node:crypto';
import type { FastifyBaseLogger } from 'fastify';
import { env } from '../env';

export interface CreatePaymentIntentInput {
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
}

export type WebhookEvent =
  | { type: 'payment_intent.succeeded'; paymentIntentId: string }
  | { type: 'payment_intent.payment_failed'; paymentIntentId: string }
  | { type: 'other' };

export interface Payments {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  constructWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent;
  /** Refund a captured PaymentIntent (used for the refundable Program submission fee on rejection). */
  refund(paymentIntentId: string): Promise<void>;
}

class StripePayments implements Payments {
  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret?: string,
  ) {}

  async createPaymentIntent({ amountCents, currency, metadata }: CreatePaymentIntentInput) {
    const pi = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['card', 'bizum'], // Bizum must be enabled on the Stripe account
      metadata,
    });
    return { id: pi.id, clientSecret: pi.client_secret ?? '' };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent {
    if (!this.webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    const pi = event.data.object as Stripe.PaymentIntent;
    if (event.type === 'payment_intent.succeeded')
      return { type: 'payment_intent.succeeded', paymentIntentId: pi.id };
    if (event.type === 'payment_intent.payment_failed')
      return { type: 'payment_intent.payment_failed', paymentIntentId: pi.id };
    return { type: 'other' };
  }

  async refund(paymentIntentId: string): Promise<void> {
    await this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}

/** Used in tests and in dev when no Stripe key is set. Webhook body is plain JSON. */
export class FakePayments implements Payments {
  async createPaymentIntent(_input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const id = `pi_test_${randomBytes(12).toString('hex')}`;
    return { id, clientSecret: `${id}_secret_test` };
  }

  constructWebhookEvent(rawBody: Buffer): WebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      paymentIntentId?: string;
    };
    if (parsed.type === 'payment_intent.succeeded' && parsed.paymentIntentId)
      return { type: 'payment_intent.succeeded', paymentIntentId: parsed.paymentIntentId };
    if (parsed.type === 'payment_intent.payment_failed' && parsed.paymentIntentId)
      return { type: 'payment_intent.payment_failed', paymentIntentId: parsed.paymentIntentId };
    return { type: 'other' };
  }

  /** Records the refund call so tests can assert it; no external effect. */
  public readonly refunded: string[] = [];
  async refund(paymentIntentId: string): Promise<void> {
    this.refunded.push(paymentIntentId);
  }
}

export function createPayments(logger: Pick<FastifyBaseLogger, 'warn'>): Payments {
  if (env.STRIPE_SECRET_KEY) {
    return new StripePayments(new Stripe(env.STRIPE_SECRET_KEY), env.STRIPE_WEBHOOK_SECRET);
  }
  logger.warn('[payments] STRIPE_SECRET_KEY not set — using fake payments (dev/test only)');
  return new FakePayments();
}
