import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Provenance',
  description: 'Zero-Knowledge Luxury Goods Authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="nav-header">
          <Link href="/" className="nav-logo">Provenance</Link>
          <nav className="nav-links">
            <Link href="/admin" className="nav-link">Manufacturer</Link>
            <Link href="/transfer" className="nav-link">Transfer</Link>
            <Link href="/verify" className="nav-link">Verify</Link>
          </nav>
        </header>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
