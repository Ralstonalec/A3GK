import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';

const display = Barlow_Condensed({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SITE } from '@/lib/content';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'A3GK — Padded base layer for goalkeepers', template: '%s | A3GK' },
  description: 'Meet the A3GK padded base layer. Explore the design, see the padding details, and find your size.',
  openGraph: { images: ['/images/base-layer-hero.webp'], siteName: 'A3GK' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
