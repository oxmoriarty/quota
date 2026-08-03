import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';

import { Navbar } from '@/components/Navbar';
import { AuthWrapper } from '@/components/AuthWrapper';

export const metadata: Metadata = {
  title: 'Quota',
  description: 'AI-powered hackathon prize allocation platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
