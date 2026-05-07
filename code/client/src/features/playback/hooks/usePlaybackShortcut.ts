'use client';

import { useEffect } from 'react';

import type { PlayState } from '../types';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.classList.contains('monaco-editor') ||
    Boolean(target.closest('.monaco-editor'))
  );
}

export function usePlaybackShortcut({
  playState,
  onPlay,
  onPause,
}: {
  playState: PlayState;
  onPlay: () => void;
  onPause: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (playState === 'playing') {
          onPause();
        } else {
          onPlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPause, onPlay, playState]);
}
