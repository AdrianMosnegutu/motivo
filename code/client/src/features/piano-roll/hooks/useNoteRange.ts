'use client';

import { useMemo } from 'react';

import { calculateNoteRange, type TrackLike } from '../lib/piano';

export function useNoteRange(tracks: TrackLike[] | null) {
  return useMemo(() => calculateNoteRange(tracks), [tracks]);
}
