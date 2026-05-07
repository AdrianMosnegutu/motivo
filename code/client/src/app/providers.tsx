'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { MidiProvider } from '@/features/midi/MidiContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      <MidiProvider>{children}</MidiProvider>
    </ThemeProvider>
  );
}
