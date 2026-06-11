import { strings, interpolate } from '@incircleme/i18n';
import { env } from '../../env';
import type { Mailer, MailerLogger } from './index';

/** Phase 2 transport. Inactive until RESEND_API_KEY is set. */
export function createResendMailer(apiKey: string, logger: MailerLogger): Mailer {
  async function send(to: string, subject: string, text: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text }),
    });
    if (!res.ok) {
      const detail = await res.text();
      logger.error({ status: res.status, detail }, '[mailer:resend] send failed');
      throw new Error(`Resend send failed: ${res.status}`);
    }
  }

  return {
    async sendMagicLink({ to, link, locale }) {
      const subject = strings[locale].magicLinkSubject;
      const body = strings[locale].magicLinkBody;
      await send(to, subject, `${body}\n\n${link}`);
    },
    async sendBookingConfirmation({ to, locale, vars }) {
      const subject = interpolate(strings[locale].bookingSubject, vars);
      const body = interpolate(strings[locale].bookingBody, vars);
      await send(to, subject, body);
    },
  };
}
