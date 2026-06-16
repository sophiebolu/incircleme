import type { FastifyInstance, FastifyRequest } from 'fastify';
import { defaultLocale } from '@incircleme/i18n';
import { createMailer } from '../lib/mailer';
import {
  logoutRequestSchema,
  magicLinkRequestSchema,
  oauthProviderSchema,
  oauthRequestSchema,
  refreshRequestSchema,
  verifyRequestSchema,
} from '../schemas/auth';
import { requestMagicLink, verifyMagicLink } from '../services/auth/magicLink';
import { verifyOAuthIdToken } from '../services/auth/oauth';
import { createSession, refreshSession, revokeSession } from '../services/auth/session';
import { findOrCreateByEmail, findOrCreateByOAuth, toUser } from '../services/auth/users';
import type { Mailer } from '../lib/mailer';

export async function authRoutes(
  app: FastifyInstance,
  opts: { mailer?: Mailer },
): Promise<void> {
  const mailer = opts.mailer ?? createMailer(app.log);

  // POST /auth/email-magic-link — always 200 (no email enumeration). Rate-limited per IP+email.
  app.post(
    '/auth/email-magic-link',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          keyGenerator: (req: FastifyRequest) => {
            const email = (req.body as { email?: string } | undefined)?.email ?? '';
            return `${req.ip}:${email.toLowerCase()}`;
          },
        },
      },
    },
    async (req, reply) => {
      const parsed = magicLinkRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
      const locale = parsed.data.locale ?? defaultLocale;
      await requestMagicLink(parsed.data.email, locale, mailer);
      return reply.code(200).send({ ok: true });
    },
  );

  // POST /auth/verify — consume magic link, find-or-create user, issue tokens.
  // Rate-limited per IP to blunt token-guessing.
  app.post('/auth/verify', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const parsed = verifyRequestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    const email = await verifyMagicLink(parsed.data.token);
    if (!email) return reply.code(401).send({ error: 'invalid_or_expired_token' });
    const user = await findOrCreateByEmail(email);
    const tokens = await createSession(user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    return reply.send({ ...tokens, user: toUser(user) });
  });

  // POST /auth/oauth/:provider — verify id_token via JWKS, find-or-create user, issue tokens.
  // Rate-limited per IP to blunt token-replay / brute-force.
  app.post('/auth/oauth/:provider', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const provider = oauthProviderSchema.safeParse((req.params as { provider?: string }).provider);
    if (!provider.success) return reply.code(404).send({ error: 'unknown_provider' });
    const body = oauthRequestSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_request' });
    try {
      const identity = await verifyOAuthIdToken(provider.data, body.data.idToken);
      if (!identity.email) return reply.code(400).send({ error: 'oauth_no_email' });
      const user = await findOrCreateByOAuth(provider.data, identity.providerUserId, identity.email);
      const tokens = await createSession(user.id, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      return reply.send({ ...tokens, user: toUser(user) });
    } catch (err) {
      req.log.warn({ err }, 'oauth verification failed');
      return reply.code(401).send({ error: 'oauth_verification_failed' });
    }
  });

  // POST /auth/refresh — rotate the refresh token, issue a fresh pair.
  app.post('/auth/refresh', async (req, reply) => {
    const parsed = refreshRequestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    const tokens = await refreshSession(parsed.data.refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    if (!tokens) return reply.code(401).send({ error: 'invalid_refresh_token' });
    return reply.send(tokens);
  });

  // DELETE /auth/session — logout: revoke the presented refresh token.
  app.delete('/auth/session', async (req, reply) => {
    const parsed = logoutRequestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    await revokeSession(parsed.data.refreshToken);
    return reply.code(204).send();
  });
}
