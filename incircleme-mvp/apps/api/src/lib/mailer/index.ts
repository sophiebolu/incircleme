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

export interface BookingVars {
  event_title: string;
  date: string;
  host: string;
  neighbourhood: string;
  day: string;
  time: string;
  // string→string bag (interpolated into the locked template)
  [key: string]: string;
}

export interface SendBookingConfirmationOptions {
  to: string;
  locale: Locale;
  vars: BookingVars;
}

export interface Mailer {
  sendMagicLink(opts: SendMagicLinkOptions): Promise<void>;
  sendBookingConfirmation(opts: SendBookingConfirmationOptions): Promise<void>;
}

export type MailerLogger = Pick<FastifyBaseLogger, 'info' | 'error'>;

/** Resend in Phase 2 when a key is set; otherwise the dev stub that logs the message. */
export function createMailer(logger: MailerLogger): Mailer {
  if (env.RESEND_API_KEY) return createResendMailer(env.RESEND_API_KEY, logger);
  return createStubMailer(logger);
}
