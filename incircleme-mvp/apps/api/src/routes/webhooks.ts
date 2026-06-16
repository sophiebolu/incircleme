import type { FastifyInstance } from 'fastify';
import { db, users } from '@incircleme/db';
import { eq } from 'drizzle-orm';
import type { Locale } from '@incircleme/types';
import type { Payments } from '../lib/payments';
import type { Mailer } from '../lib/mailer';
import { confirmByPaymentIntent, releaseByPaymentIntent } from '../services/booking/booking';
import { ensureCircleAndMembership } from '../services/circles/circles';
import { confirmProgramSubmission, failProgramSubmission } from '../services/programs/programs';

export async function webhookRoutes(
  app: FastifyInstance,
  opts: { payments: Payments; mailer: Mailer },
): Promise<void> {
  // Stripe needs the raw body for signature verification. Buffer parser, scoped to this plugin.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) =>
    done(null, body),
  );

  app.post('/webhooks/stripe', async (req, reply) => {
    const signature = (req.headers['stripe-signature'] as string | undefined) ?? '';
    let event;
    try {
      event = opts.payments.constructWebhookEvent(req.body as Buffer, signature);
    } catch (err) {
      req.log.warn({ err }, 'stripe webhook verification failed');
      return reply.code(400).send({ error: 'invalid_signature' });
    }

    if (event.type === 'payment_intent.succeeded') {
      // Dispatch on the PI's metadata kind; probe both tables only for legacy
      // events that predate the kind tag (booking first, then program).
      let ctx = null;
      if (event.kind === 'program_submission') {
        await confirmProgramSubmission(event.paymentIntentId);
      } else if (event.kind === 'booking') {
        ctx = await confirmByPaymentIntent(event.paymentIntentId);
      } else {
        ctx = await confirmByPaymentIntent(event.paymentIntentId);
        if (!ctx) await confirmProgramSubmission(event.paymentIntentId);
      }
      if (ctx) {
        // One Circle per event, auto-created on first confirmed booking (host + attendee join).
        try {
          await ensureCircleAndMembership(ctx.event.id, ctx.booking.userId);
        } catch (err) {
          req.log.error({ err }, 'circle auto-create failed');
        }
        const [user] = await db.select().from(users).where(eq(users.id, ctx.booking.userId)).limit(1);
        const [host] = await db.select().from(users).where(eq(users.id, ctx.event.hostUserId)).limit(1);
        if (user) {
          const locale = (user.language as Locale) ?? 'ca';
          const startsAt = ctx.event.startsAt;
          const fmt = (o: Intl.DateTimeFormatOptions) =>
            new Intl.DateTimeFormat(locale, o).format(startsAt);
          await opts.mailer.sendBookingConfirmation({
            to: user.email,
            locale,
            vars: {
              event_title: ctx.event.title,
              date: fmt({ day: 'numeric', month: 'long' }),
              host: host?.displayName ?? 'IncircleMe',
              neighbourhood: ctx.event.neighbourhood ?? '',
              day: fmt({ weekday: 'long' }),
              time: fmt({ hour: '2-digit', minute: '2-digit' }),
            },
          });
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      // Same dispatch: release a held booking, or release a stuck program submission.
      if (event.kind === 'program_submission') {
        await failProgramSubmission(event.paymentIntentId);
      } else if (event.kind === 'booking') {
        await releaseByPaymentIntent(event.paymentIntentId);
      } else {
        // Legacy event without a kind — both are scoped no-ops on a non-match.
        await releaseByPaymentIntent(event.paymentIntentId);
        await failProgramSubmission(event.paymentIntentId);
      }
    }

    return reply.code(200).send({ received: true });
  });
}
