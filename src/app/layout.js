import { Fasthand, Inter, Roboto } from 'next/font/google';
import localFont from 'next/font/local';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  display: 'swap',
});

// Loaded locally so Next can measure the file and build a size-matched fallback.
// next/font/google has no precomputed metrics for Libertinus Serif yet.
const libertinusSerif = localFont({
  src: './fonts/libertinus-serif-latin.woff2',
  variable: '--font-libertinus',
  weight: '400',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const fasthand = Fasthand({
  variable: '--font-fasthand',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata = {
  title: 'Milestones & Meaning',
  description:
    'Support for every chapter — marriage preparation, ceremonies, relationship support and grief care.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto.variable} ${libertinusSerif.variable} ${fasthand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
