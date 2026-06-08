import { describe, expect, it } from 'vitest';

import {
  calculateNoteRange,
  clampFollowScrollLeft,
  isAutoFollowScroll,
  isBlackKey,
  isOctaveSeparatorBelowRow,
} from '@/features/piano-roll/lib/piano';

describe('piano helpers', () => {
  it('detects black keys by MIDI pitch class', () => {
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(60)).toBe(false);
  });

  it('uses a default range when there are no notes', () => {
    expect(calculateNoteRange([])).toEqual({ minMidi: 48, maxMidi: 84 });
  });

  it('anchors follow scroll so the playhead sits at a fixed viewport ratio', () => {
    expect(clampFollowScrollLeft(900, 400, 2000, 0.35)).toBe(760);
    expect(clampFollowScrollLeft(50, 400, 2000, 0.35)).toBe(0);
    expect(clampFollowScrollLeft(1900, 400, 2000, 0.35)).toBe(1600);
  });

  it('detects user horizontal pans vs follow-driven scroll', () => {
    expect(isAutoFollowScroll(200, 201)).toBe(true);
    expect(isAutoFollowScroll(200, 210)).toBe(false);
  });

  it('marks horizontal separators only between MIDI octaves', () => {
    const rows = [64, 63, 62, 61, 60, 59];

    expect(isOctaveSeparatorBelowRow(rows, 3)).toBe(false);
    expect(isOctaveSeparatorBelowRow(rows, 4)).toBe(true);
    expect(isOctaveSeparatorBelowRow(rows, 5)).toBe(false);
  });

  it('pads the note range and clamps to MIDI bounds', () => {
    expect(calculateNoteRange([{ notes: [{ midi: 0 }, { midi: 126 }] }])).toEqual({
      minMidi: 0,
      maxMidi: 127,
    });
  });
});
