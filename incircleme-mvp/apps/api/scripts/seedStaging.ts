// Staging seed — enough content for the founder to browse and test end-to-end:
// two demo hosts, a few upcoming events, and ONE already-verified Program (with
// seeded Voices + Q&A) so the public Programs surfaces aren't empty. No dev-login
// users. Idempotent: safe to run more than once. Run via `fly ssh console`:
//   pnpm --filter @incircleme/api exec tsx scripts/seedStaging.ts
import { and, eq } from 'drizzle-orm';
import { db, users, events, programs, programVoices, programQuestions, pool } from '@incircleme/db';
import { createDraft } from '../src/services/programs/programs';

const day = (n: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function upsertHost(email: string, displayName: string, neighbourhood: string, bio: string) {
  const [row] = await db
    .insert(users)
    .values({ email, displayName, neighbourhood, bio, hostTier: 'premium', verified: true })
    .onConflictDoUpdate({
      target: users.email,
      set: { displayName, neighbourhood, bio, hostTier: 'premium', verified: true },
    })
    .returning();
  return row!;
}

async function main() {
  const teresa = await upsertHost(
    'teresa@incircleme.test',
    'Teresa Folch',
    'Sants',
    'Ceramicist · small wheel-throwing rooms',
  );
  const marc = await upsertHost(
    'marc@incircleme.test',
    'Marc Pujol',
    'Gràcia',
    'Sound-bath guide',
  );

  // Upcoming events (only if there are none yet for these hosts).
  const existing = await db.select().from(events).where(eq(events.hostUserId, teresa.id));
  if (existing.length === 0) {
    await db.insert(events).values([
      {
        hostUserId: teresa.id,
        title: 'Hands in Clay — Sunday wheel',
        description: 'Four hands, one wheel, a quiet afternoon.',
        category: 'art_craft',
        neighbourhood: 'Sants',
        address: 'Carrer de Sants 12, Sants',
        startsAt: day(3, 18),
        endsAt: day(3, 20),
        durationMinutes: 120,
        seatCount: 8,
        priceCents: 2200,
        photoUrls: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261'],
      },
      {
        hostUserId: marc.id,
        title: 'Sound bath at dusk',
        description: 'Lie down. Let the bowls do the work.',
        category: 'wellness',
        neighbourhood: 'Gràcia',
        address: 'Plaça del Sol 3, Gràcia',
        startsAt: day(2, 20),
        endsAt: day(2, 21),
        durationMinutes: 60,
        seatCount: 12,
        priceCents: 1500,
        photoUrls: ['https://images.unsplash.com/photo-1591291621164-2c6367723315'],
      },
    ]);
  }

  // One verified Program (so the public listing + detail have content).
  const verified = await db
    .select()
    .from(programs)
    .where(and(eq(programs.hostUserId, teresa.id), eq(programs.status, 'verified')));
  if (verified.length === 0) {
    const program = await createDraft(teresa.id, {
      title: 'Hands in Clay',
      description: 'Six Sundays. The same six people. Wedging, throwing, trimming, glazing, firing.',
      timeFrameSessions: 6,
      timeFrameTotalHours: 18,
      assessmentMethod: 'Show up to 5 of 6 weeks, throw a vessel that holds water, and glaze a piece.',
      accreditationBody: 'Escola de Ceràmica de Barcelona',
      accreditationId: 'ECB-2024-077',
      curriculum: [
        { week: 1, title: 'Wedge & centre' },
        { week: 2, title: 'Throw a vessel' },
        { week: 3, title: 'Trim & finish' },
        { week: 4, title: 'Glaze theory + dipping' },
        { week: 5, title: 'Kiln day' },
        { week: 6, title: 'The opening' },
      ],
      references: [{ name: 'Maria Llull', role: 'ceramista' }],
    });
    await db
      .update(programs)
      .set({
        status: 'verified',
        verifiedTier: 'verified',
        verifiedAt: new Date(),
        verifiedBy: teresa.id,
      })
      .where(eq(programs.id, program.id));
    await db.insert(programVoices).values([
      {
        programId: program.id,
        quote:
          "Six Sundays later I'm trimming foot rings on a saucer that holds my morning coffee.",
        attribution: 'Sofía R. · February cohort',
        cohortLabel: 'Kept the Circle. Came back for round two.',
        position: 0,
      },
      {
        programId: program.id,
        quote: 'Teresa makes the wheel feel like the easiest thing in the room.',
        attribution: 'Joan M. · February cohort',
        cohortLabel: 'Bring a friend, share the wheel, eat after.',
        position: 1,
      },
    ]);
    await db.insert(programQuestions).values([
      {
        programId: program.id,
        askerName: 'Marc P.',
        question: 'I have weak wrists from a climbing injury — would the wheel work be too much?',
        answer: "Honestly — you'd be fine. Centring needs grip more than strength.",
        answeredAt: new Date(),
      },
    ]);
  }

  const evCount = await db.select().from(events);
  console.log(`staging seed: hosts Teresa+Marc, ${evCount.length} events, 1 verified Program`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
