'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthContext';
import { IdeActionsProvider } from '@/features/ide/context/IdeActionsContext';
import { MidiProvider } from '@/features/midi/MidiContext';
import { PlaybackControllerProvider } from '@/features/playback/PlaybackControllerContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MidiProvider>
        <IdeActionsProvider>
          <PlaybackControllerProvider>{children}</PlaybackControllerProvider>
        </IdeActionsProvider>
      </MidiProvider>
    </AuthProvider>
  );
}
