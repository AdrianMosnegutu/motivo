import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';

import { APP_DESCRIPTION, APP_TITLE } from '@/config/app';
import AuthShell from '@/features/auth/components/AuthShell';
import ThemeToggle from '@/shared/components/ThemeToggle';

import Providers from './providers';

import './globals.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col bg-background text-foreground antialiased">
        <Providers>
          <header className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-border bg-toolbar">
            <span className="font-mono text-sm font-semibold tracking-widest uppercase">
              {APP_TITLE}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <AuthShell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex flex-1 min-h-0">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
