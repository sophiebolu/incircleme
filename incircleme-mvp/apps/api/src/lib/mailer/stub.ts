import { strings } from '@incircleme/i18n';
import type { Mailer, MailerLogger } from './index';

/** Local-dev transport: logs the locked email copy + the magic link. Never sends. */
export function createStubMailer(logger: MailerLogger): Mailer {
  return {
    async sendMagicLink({ to, link, locale }) {
      const subject = strings[locale].magicLinkSubject;
      const body = strings[locale].magicLinkBody;
      logger.info(
        { to, locale, subject, link },
        '[mailer:stub] magic link generated (not sent in dev)',
      );
      logger.info(
        `\n===== MAGIC LINK (${to}) =====\n${subject}\n${body}\n${link}\n==============================`,
      );
    },
  };
}
