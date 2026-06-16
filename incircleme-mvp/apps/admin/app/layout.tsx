export const metadata = {
  title: 'IncircleMe Trust — review',
  description: 'Internal Program review queue',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#F7F3ED',
          color: '#1C1C1E',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <header
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #E5DFD6',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          IncircleMe <span style={{ color: '#A6563A' }}>Trust</span>
          <span style={{ color: '#6B6762', fontWeight: 500 }}> · Program review</span>
        </header>
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px' }}>{children}</main>
      </body>
    </html>
  );
}
