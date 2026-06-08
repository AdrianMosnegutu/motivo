import { describe, expect, it } from 'vitest';

import { findVisibleNoteRange } from '@/features/piano-roll/lib/visible-range';

describe('findVisibleNoteRange', () => {
  const notes = [
    { time: 0, duration: 1 },
    { time: 2, duration: 1 },
    { time: 4, duration: 1 },
    { time: 10, duration: 1 },
  ];

  it('returns only notes intersecting the time window', () => {
    expect(findVisibleNoteRange(notes, 1.5, 5)).toEqual({ start: 1, end: 3 });
  });

  it('returns an empty slice when nothing is visible', () => {
    expect(findVisibleNoteRange(notes, 20, 30)).toEqual({ start: 4, end: 4 });
  });
});
