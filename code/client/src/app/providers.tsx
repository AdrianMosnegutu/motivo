'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { AuthProvider } from '@/features/auth/AuthContext';
import { MidiProvider } from '@/features/midi/MidiContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      <AuthProvider>
        <MidiProvider>{children}</MidiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
