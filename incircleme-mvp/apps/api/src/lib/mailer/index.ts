import type { FastifyBaseLogger } from 'fastify';
import type { Locale } from '@incircleme/types';
import { env } from '../../env';
import { createStubMailer } from './stub';
import { createResendMailer } from './resend';

export interface SendMagicLinkOptions {
  to: string;
  link: string;
  locale: Locale;
}

export interface Mailer {
  sendMagicLink(opts: SendMagicLinkOptions): Promise<void>;
}

export type MailerLogger = Pick<FastifyBaseLogger, 'info' | 'error'>;

/** Resend in Phase 2 when a key is set; otherwise the dev stub that logs the link. */
export function createMailer(logger: MailerLogger): Mailer {
  if (env.RESEND_API_KEY) return createResendMailer(env.RESEND_API_KEY, logger);
  return createStubMailer(logger);
}
