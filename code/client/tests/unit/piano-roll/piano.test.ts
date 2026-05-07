import { describe, expect, it } from 'vitest';

import { calculateNoteRange, isBlackKey } from '@/features/piano-roll/lib/piano';

describe('piano helpers', () => {
  it('detects black keys by MIDI pitch class', () => {
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(60)).toBe(false);
  });

  it('uses a default range when there are no notes', () => {
    expect(calculateNoteRange([])).toEqual({ minMidi: 48, maxMidi: 84 });
  });

  it('pads the note range and clamps to MIDI bounds', () => {
    expect(calculateNoteRange([{ notes: [{ midi: 0 }, { midi: 126 }] }])).toEqual({
      minMidi: 0,
      maxMidi: 127,
    });
  });
});
