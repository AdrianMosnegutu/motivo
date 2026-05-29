import { describe, expect, it, vi } from 'vitest';

import { stopPlayers, stopScheduledVoices } from '@/features/playback/lib/audio-nodes';

describe('audio node helpers', () => {
  it('stops scheduled voices and ignores already-stopped voices', () => {
    const stop = vi.fn();
    const throwingStop = vi.fn(() => {
      throw new Error('already stopped');
    });

    expect(() => stopScheduledVoices([{ stop }, { stop: throwingStop }])).not.toThrow();

    expect(stop).toHaveBeenCalledWith(0);
    expect(throwingStop).toHaveBeenCalledWith(0);
  });

  it('stops playback players and ignores failures', () => {
    const stop = vi.fn();
    const throwingStop = vi.fn(() => {
      throw new Error('already stopped');
    });

    expect(() =>
      stopPlayers([
        { playNote: vi.fn(), stop },
        { playNote: vi.fn(), stop: throwingStop },
      ]),
    ).not.toThrow();

    expect(stop).toHaveBeenCalledWith(0);
    expect(throwingStop).toHaveBeenCalledWith(0);
  });
});
