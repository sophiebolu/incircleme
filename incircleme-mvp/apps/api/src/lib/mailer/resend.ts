import { strings } from '@incircleme/i18n';
import { env } from '../../env';
import type { Mailer, MailerLogger } from './index';

/** Phase 2 transport. Inactive until RESEND_API_KEY is set. */
export function createResendMailer(apiKey: string, logger: MailerLogger): Mailer {
  return {
    async sendMagicLink({ to, link, locale }) {
      const subject = strings[locale].magicLinkSubject;
      const body = strings[locale].magicLinkBody;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to,
          subject,
          text: `${body}\n\n${link}`,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        logger.error({ status: res.status, detail }, '[mailer:resend] send failed');
        throw new Error(`Resend send failed: ${res.status}`);
      }
    },
  };
}
