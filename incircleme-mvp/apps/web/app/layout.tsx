export const metadata = {
  title: 'IncircleMe',
  description: 'Petites sales · Barcelona',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca">
      <body
        style={{
          margin: 0,
          background: '#F7F3ED',
          color: '#1C1C1E',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
