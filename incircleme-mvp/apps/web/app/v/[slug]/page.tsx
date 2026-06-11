// Public certificate verification page — read-only. Stub until the Programs slice.
export default async function Verify({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main style={{ padding: 48 }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#2E4531' }}>
        Certificate {slug}
      </h1>
      <p>Verified by IncircleMe Trust · the certificate is real.</p>
      <p style={{ color: '#A09B92' }}>Verification page — stub (Programs slice).</p>
    </main>
  );
}
