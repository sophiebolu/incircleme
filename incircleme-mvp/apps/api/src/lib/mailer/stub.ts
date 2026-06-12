import { strings, interpolate } from '@incircleme/i18n';
import type { Mailer, MailerLogger } from './index';

/** Local-dev transport: logs the locked copy. Never sends. */
export function createStubMailer(logger: MailerLogger): Mailer {
  return {
    async sendMagicLink({ to, link, locale }) {
      const subject = strings[locale].magicLinkSubject;
      const body = strings[locale].magicLinkBody;
      logger.info({ to, locale, subject, link }, '[mailer:stub] magic link (not sent in dev)');
      logger.info(
        `\n===== MAGIC LINK (${to}) =====\n${subject}\n${body}\n${link}\n==============================`,
      );
    },
    async sendBookingConfirmation({ to, locale, vars }) {
      const subject = interpolate(strings[locale].bookingSubject, vars);
      const body = interpolate(strings[locale].bookingBody, vars);
      logger.info({ to, locale, subject }, '[mailer:stub] booking confirmation (not sent in dev)');
      logger.info(
        `\n===== BOOKING CONFIRMATION (${to}) =====\n${subject}\n${body}\n========================================`,
      );
    },
  };
}
