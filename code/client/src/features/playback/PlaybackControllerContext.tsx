'use client';

import { createContext, type ReactNode, useContext, useMemo, useRef } from 'react';

interface PlaybackControllerValue {
  seek: (seconds: number) => void;
  registerSeek: (handler: (seconds: number) => void) => void;
}

const PlaybackControllerContext = createContext<PlaybackControllerValue | null>(null);

export function PlaybackControllerProvider({ children }: { children: ReactNode }) {
  const seekRef = useRef<(seconds: number) => void>(() => {});

  const value = useMemo<PlaybackControllerValue>(
    () => ({
      seek: (seconds) => seekRef.current(seconds),
      registerSeek: (handler) => {
        seekRef.current = handler;
      },
    }),
    [],
  );

  return (
    <PlaybackControllerContext.Provider value={value}>
      {children}
    </PlaybackControllerContext.Provider>
  );
}

const NOOP_CONTROLLER: PlaybackControllerValue = {
  seek: () => {},
  registerSeek: () => {},
};

export function usePlaybackController() {
  return useContext(PlaybackControllerContext) ?? NOOP_CONTROLLER;
}
