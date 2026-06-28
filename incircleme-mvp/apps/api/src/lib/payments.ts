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

// ── Deposit capability surface (groundwork · ADR D5) ─────────────────────────────────────
// SCAFFOLDING ONLY. Layer 2 (save-card / SetupIntent / SCA) and Layer 3 (authorize / capture
// / release) are deferred; no app path calls these yet. The real impl throws; FakePayments
// records calls so future slices can assert against them.
export interface SaveCardForDepositInput {
  /** Stripe Customer (users.stripe_customer_id), created/linked in Layer 2. */
  customerId: string;
  bookingId: string;
}
export interface AuthorizeDepositInput {
  bookingId: string;
  amountCents: number;
  customerId: string;
  paymentMethodId: string;
  idempotencyKey?: string;
}
export interface CaptureDepositInput {
  /** PaymentIntent that authorized the hold (bookings.deposit_auth_intent_id). */
  authIntentId: string;
  /** Capture up to the authorized amount; omit to capture in full. */
  amountCents?: number;
  idempotencyKey?: string;
}
export interface ReleaseDepositInput {
  authIntentId: string;
  idempotencyKey?: string;
}
export interface SaveCardResult {
  /** SetupIntent client secret for on-device SCA confirmation (Layer 2). */
  clientSecret: string;
}
export interface AuthorizeDepositResult {
  /** The manual-capture PaymentIntent id holding the deposit (Layer 3). */
  authIntentId: string;
}

export type WebhookEvent =
  // `kind` mirrors the PaymentIntent metadata ('booking' | 'program_submission'),
  // letting the webhook route dispatch without probing tables. Undefined for
  // legacy/hand-crafted events, in which case the route falls back to probing.
  | { type: 'payment_intent.succeeded'; paymentIntentId: string; kind?: string }
  | { type: 'payment_intent.payment_failed'; paymentIntentId: string; kind?: string }
  | { type: 'other' };

export interface Payments {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  constructWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent;
  /**
   * Refund a captured PaymentIntent (used for the refundable Program submission fee on rejection).
   * `idempotencyKey` makes a retried refund a no-op at Stripe rather than a double refund.
   */
  refund(paymentIntentId: string, idempotencyKey?: string): Promise<void>;

  // Deposit lifecycle (SCAFFOLDING — Layers 2 & 3 deferred, no caller yet).
  saveCardForDeposit(input: SaveCardForDepositInput): Promise<SaveCardResult>;
  authorizeDeposit(input: AuthorizeDepositInput): Promise<AuthorizeDepositResult>;
  captureDeposit(input: CaptureDepositInput): Promise<void>;
  releaseDeposit(input: ReleaseDepositInput): Promise<void>;
}

/** Guard for the unimplemented deposit surface — if this ever throws in app paths, a layer
 *  was wired before its implementation landed. */
const DEPOSIT_NOT_IMPLEMENTED = (method: string): never => {
  throw new Error(`[payments] ${method} not implemented — deposit Layer 2/3 deferred (ADR D5)`);
};

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
    const kind = pi.metadata?.kind;
    if (event.type === 'payment_intent.succeeded')
      return { type: 'payment_intent.succeeded', paymentIntentId: pi.id, kind };
    if (event.type === 'payment_intent.payment_failed')
      return { type: 'payment_intent.payment_failed', paymentIntentId: pi.id, kind };
    return { type: 'other' };
  }

  async refund(paymentIntentId: string, idempotencyKey?: string): Promise<void> {
    await this.stripe.refunds.create(
      { payment_intent: paymentIntentId },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  }

  // Deposit surface — deferred. These are never reached from app paths in this slice.
  async saveCardForDeposit(_input: SaveCardForDepositInput): Promise<SaveCardResult> {
    return DEPOSIT_NOT_IMPLEMENTED('saveCardForDeposit');
  }
  async authorizeDeposit(_input: AuthorizeDepositInput): Promise<AuthorizeDepositResult> {
    return DEPOSIT_NOT_IMPLEMENTED('authorizeDeposit');
  }
  async captureDeposit(_input: CaptureDepositInput): Promise<void> {
    return DEPOSIT_NOT_IMPLEMENTED('captureDeposit');
  }
  async releaseDeposit(_input: ReleaseDepositInput): Promise<void> {
    return DEPOSIT_NOT_IMPLEMENTED('releaseDeposit');
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
      kind?: string;
    };
    if (parsed.type === 'payment_intent.succeeded' && parsed.paymentIntentId)
      return {
        type: 'payment_intent.succeeded',
        paymentIntentId: parsed.paymentIntentId,
        kind: parsed.kind,
      };
    if (parsed.type === 'payment_intent.payment_failed' && parsed.paymentIntentId)
      return {
        type: 'payment_intent.payment_failed',
        paymentIntentId: parsed.paymentIntentId,
        kind: parsed.kind,
      };
    return { type: 'other' };
  }

  /** Records the refund call so tests can assert it; no external effect. */
  public readonly refunded: string[] = [];
  /** Test fault injection: throw on every refund, or only for these PaymentIntent ids. */
  public failRefunds = false;
  public readonly failRefundPis = new Set<string>();
  async refund(paymentIntentId: string, _idempotencyKey?: string): Promise<void> {
    if (this.failRefunds || this.failRefundPis.has(paymentIntentId)) {
      throw new Error(`fake_refund_failed:${paymentIntentId}`);
    }
    this.refunded.push(paymentIntentId);
  }

  // Deposit surface — record calls so future Layer 2/3 slices can assert against them.
  public readonly savedCards: SaveCardForDepositInput[] = [];
  public readonly authorizedDeposits: AuthorizeDepositInput[] = [];
  public readonly capturedDeposits: CaptureDepositInput[] = [];
  public readonly releasedDeposits: ReleaseDepositInput[] = [];
  async saveCardForDeposit(input: SaveCardForDepositInput): Promise<SaveCardResult> {
    this.savedCards.push(input);
    return { clientSecret: `seti_test_${randomBytes(8).toString('hex')}_secret` };
  }
  async authorizeDeposit(input: AuthorizeDepositInput): Promise<AuthorizeDepositResult> {
    this.authorizedDeposits.push(input);
    return { authIntentId: `pi_deposit_test_${randomBytes(8).toString('hex')}` };
  }
  async captureDeposit(input: CaptureDepositInput): Promise<void> {
    this.capturedDeposits.push(input);
  }
  async releaseDeposit(input: ReleaseDepositInput): Promise<void> {
    this.releasedDeposits.push(input);
  }
}

export function createPayments(logger: Pick<FastifyBaseLogger, 'warn'>): Payments {
  // In production both keys are mandatory: without the secret key we would charge
  // no one, and without the webhook secret we could not verify payment events.
  // Never silently fall back to fake payments there — fail fast at startup instead.
  if (env.NODE_ENV === 'production' && (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET)) {
    throw new Error(
      '[payments] STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production',
    );
  }
  if (env.STRIPE_SECRET_KEY) {
    return new StripePayments(new Stripe(env.STRIPE_SECRET_KEY), env.STRIPE_WEBHOOK_SECRET);
  }
  logger.warn('[payments] STRIPE_SECRET_KEY not set — using fake payments (dev/test only)');
  return new FakePayments();
}
