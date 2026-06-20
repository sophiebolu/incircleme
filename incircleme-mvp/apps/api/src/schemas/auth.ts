import { z } from 'zod';
import { isBarrio, isIntent, isInterest } from '@incircleme/config';

export const localeSchema = z.enum(['ca', 'es', 'en']);

export const magicLinkRequestSchema = z.object({
  email: z.string().email(),
  locale: localeSchema.optional(),
});

export const verifyRequestSchema = z.object({
  token: z.string().min(1),
});

export const oauthProviderSchema = z.enum(['google', 'apple']);

export const oauthRequestSchema = z.object({
  idToken: z.string().min(1),
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  language: localeSchema.optional(),
  // Onboarding step saves — picks validated against the canonical config taxonomies.
  neighbourhood: z.string().refine(isBarrio, 'unknown_barrio').optional(),
  intents: z.array(z.string().refine(isIntent, 'unknown_intent')).max(20).optional(),
  interests: z.array(z.string().refine(isInterest, 'unknown_interest')).max(20).optional(),
  notificationPrefs: z
    .object({ circles: z.boolean().optional(), nearby: z.boolean().optional() })
    .optional(),
  onboardingCompleted: z.boolean().optional(),
});
