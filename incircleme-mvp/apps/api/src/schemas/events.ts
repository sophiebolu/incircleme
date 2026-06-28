import { z } from 'zod';

export const categorySchema = z.enum([
  'food_drink',
  'wellness',
  'art_craft',
  'music',
  'nature',
  'learning',
]);

export const eventsQuerySchema = z.object({
  category: categorySchema.optional(),
  neighbourhood: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const createEventSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().max(4000).optional(),
    language: z.enum(['ca', 'es', 'en']).optional(),
    category: categorySchema,
    neighbourhood: z.string().optional(),
    address: z.string().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    seatCount: z.number().int().min(1).max(50),
    priceCents: z.number().int().min(0),
    photoUrls: z.array(z.string().url()).optional(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export const bookSchema = z.object({
  seatCount: z.number().int().min(1).max(10).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

/** Zod-typed contract for GET /bookings/:id/cancel-quote. */
export const cancelQuoteSchema = z.object({
  refundCents: z.number().int(),
  creditCents: z.number().int(),
  depositForfeited: z.boolean(),
  refundStatus: z.enum(['none', 'pending', 'partial', 'full', 'failed']),
  hasDeposit: z.boolean(),
  cutoffHours: z.number().int(),
});
