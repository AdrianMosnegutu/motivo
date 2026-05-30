import { describe, expect, it } from 'vitest';

import {
  findFirstNoteAtOrAfter,
  flattenMidiNotes,
} from '@/features/playback/lib/flatten-midi-notes';

describe('flattenMidiNotes', () => {
  it('flattens and sorts notes by start time', () => {
    const notes = flattenMidiNotes([
      {
        notes: [
          { time: 2, duration: 1, midi: 62, velocity: 0.8 },
          { time: 0, duration: 1, midi: 60, velocity: 0.8 },
        ],
      },
      {
        notes: [{ time: 1, duration: 1, midi: 61, velocity: 0.8 }],
      },
    ]);

    expect(notes.map((note) => note.time)).toEqual([0, 1, 2]);
    expect(notes.map((note) => note.trackIndex)).toEqual([0, 1, 0]);
  });

  it('finds the first note at or after a seek time', () => {
    const notes = flattenMidiNotes([
      {
        notes: [
          { time: 0, duration: 1, midi: 60, velocity: 0.8 },
          { time: 2, duration: 1, midi: 62, velocity: 0.8 },
          { time: 4, duration: 1, midi: 64, velocity: 0.8 },
        ],
      },
    ]);

    expect(findFirstNoteAtOrAfter(notes, 0)).toBe(0);
    expect(findFirstNoteAtOrAfter(notes, 2)).toBe(1);
    expect(findFirstNoteAtOrAfter(notes, 3)).toBe(2);
    expect(findFirstNoteAtOrAfter(notes, 10)).toBe(3);
  });
});
