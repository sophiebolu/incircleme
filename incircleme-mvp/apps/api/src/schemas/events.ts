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

// Cancel takes no body params (actor is derived from auth). Kept as a hook + for the
// uniform `safeParse` route pattern; a future `reason` would be persisted, not just parsed.
export const cancelBookingSchema = z.object({});

/** Zod-typed contract for GET /bookings/:id/cancel-quote. */
export const cancelQuoteSchema = z.object({
  refundCents: z.number().int(),
  creditCents: z.number().int(),
  depositForfeited: z.boolean(),
  refundStatus: z.enum(['none', 'pending', 'partial', 'full', 'failed']),
  hasDeposit: z.boolean(),
  cutoffHours: z.number().int(),
});

/** Body for POST /events/:eventId/checkin — the scanned booking id (event comes from the path). */
export const checkInSchema = z.object({
  bookingId: z.string().uuid(),
});

/** Zod-typed response for GET /events/:id/attendees (host roster). */
export const eventAttendeesSchema = z.array(
  z.object({
    bookingId: z.string().uuid(),
    attendee: z.object({
      id: z.string().uuid(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    }),
    checkedInAt: z.string().nullable(),
  }),
);

/** Zod-typed response for GET /me/hosted-events. */
export const hostedEventsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    startsAt: z.string(),
    status: z.enum(['upcoming', 'past', 'cancelled']),
    confirmedCount: z.number().int(),
    checkedInCount: z.number().int(),
  }),
);
