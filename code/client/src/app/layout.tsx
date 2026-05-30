import type { Metadata } from 'next';
import { Fira_Code, Inter } from 'next/font/google';

import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_DESCRIPTION, APP_TITLE } from '@/config/app';
import AppHeader from '@/features/ide/components/AppHeader';

import Providers from './providers';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
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
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${firaCode.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col bg-background text-foreground antialiased">
        <Providers>
          <TooltipProvider delayDuration={200}>
            <AppHeader />
            <main className="flex min-h-0 flex-1 gap-2 p-2">{children}</main>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
