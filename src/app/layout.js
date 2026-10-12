import Navbar from '@/components/layout/Navbar';
import { fasthand, inter, libertinusSerif, roboto } from './fonts';
import './globals.css';

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
