import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import '../index.css';

const geist = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'DriveHub — Vehicle inspection, valuation & live dealer auctions',
  description:
    'Multi-tenant platform for North Cyprus vehicle galleries: VIN decoding, AI damage inspection, valuation and live B2B auctions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
