import { sql } from 'drizzle-orm';
import { db, users, events, pool } from '@incircleme/db';

// Demo Gràcia hosts + events so the Browse + Book UI has data. Dev only.
async function main() {
  await db.execute(sql`truncate table bookings, events restart identity cascade`);

  const [teresa] = await db
    .insert(users)
    .values({
      email: 'teresa@incircleme.test',
      displayName: 'Teresa',
      bio: 'Ceramicist · small wheel-throwing rooms in Gràcia',
      neighbourhood: 'Gràcia',
      trustTier: 'trusted',
      verified: true,
    })
    .onConflictDoUpdate({ target: users.email, set: { displayName: 'Teresa' } })
    .returning();

  const [marc] = await db
    .insert(users)
    .values({
      email: 'marc@incircleme.test',
      displayName: 'Marc',
      bio: 'Sound-bath guide',
      neighbourhood: 'Gràcia',
      trustTier: 'regular',
      verified: true,
    })
    .onConflictDoUpdate({ target: users.email, set: { displayName: 'Marc' } })
    .returning();

  const day = (n: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  await db.insert(events).values([
    {
      hostUserId: teresa!.id,
      title: 'Hands in Clay — Sunday wheel',
      description: 'Four hands, one wheel, a quiet afternoon.',
      category: 'art_craft',
      neighbourhood: 'Gràcia',
      address: "Carrer de Verdi 22, Gràcia",
      startsAt: day(2, 18),
      endsAt: day(2, 20),
      durationMinutes: 120,
      seatCount: 8,
      priceCents: 2200,
      photoUrls: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261'],
    },
    {
      hostUserId: marc!.id,
      title: 'Sound bath at dusk',
      description: 'Lie down. Let the bowls do the work.',
      category: 'wellness',
      neighbourhood: 'Gràcia',
      address: 'Plaça del Sol 3, Gràcia',
      startsAt: day(1, 20),
      endsAt: day(1, 21),
      durationMinutes: 60,
      seatCount: 12,
      priceCents: 1500,
      photoUrls: ['https://images.unsplash.com/photo-1591291621164-2c6367723315'],
    },
    {
      hostUserId: teresa!.id,
      title: 'Catalan for newcomers — table talk',
      description: 'Order a coffee in Catalan by the end.',
      category: 'learning',
      neighbourhood: 'Gràcia',
      startsAt: day(3, 19),
      endsAt: day(3, 20),
      durationMinutes: 90,
      seatCount: 6,
      priceCents: 1000,
    },
  ]);

  const count = await db.select().from(events);
  console.log(`seeded ${count.length} events, hosts: Teresa, Marc`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
