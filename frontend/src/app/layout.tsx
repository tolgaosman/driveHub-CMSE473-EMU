import type { Metadata } from 'next';
import { Providers } from './providers';
import '../index.css';

export const metadata: Metadata = {
  title: 'DriveHub — Omni-Channel Vehicle Lifecycle, Live Auction & AI-Valuation',
  description:
    'Multi-tenant North Cyprus automotive gallery platform: ISO 3779 VIN decoding, YOLOv8 exterior damage inspection, dynamic valuation, and atomic live B2B auctions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#EA6A12]/20 selection:text-[#EA6A12]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
