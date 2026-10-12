import { Fasthand, Inter, Roboto } from 'next/font/google';
import localFont from 'next/font/local';

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  display: 'swap',
});

export const libertinusSerif = localFont({
  src: './fonts/libertinus-serif-latin.woff2',
  variable: '--font-libertinus',
  weight: '400',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

export const fasthand = Fasthand({
  variable: '--font-fasthand',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});
