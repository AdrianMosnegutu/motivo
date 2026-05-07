import { describe, expect, it, vi } from 'vitest';

import { stopAudioNodes, stopPlayers } from '@/features/playback/lib/audio-nodes';

describe('audio node helpers', () => {
  it('stops scheduled audio nodes and ignores already-stopped nodes', () => {
    const stop = vi.fn();
    const throwingStop = vi.fn(() => {
      throw new Error('already stopped');
    });

    expect(() =>
      stopAudioNodes([
        { stop } as unknown as AudioBufferSourceNode,
        { stop: throwingStop } as unknown as AudioBufferSourceNode,
      ]),
    ).not.toThrow();

    expect(stop).toHaveBeenCalledWith(0);
    expect(throwingStop).toHaveBeenCalledWith(0);
  });

  it('stops soundfont players and ignores failures', () => {
    const stop = vi.fn();
    const throwingStop = vi.fn(() => {
      throw new Error('already stopped');
    });

    expect(() =>
      stopPlayers([
        { play: vi.fn(), stop },
        { play: vi.fn(), stop: throwingStop },
      ]),
    ).not.toThrow();

    expect(stop).toHaveBeenCalledWith(0);
    expect(throwingStop).toHaveBeenCalledWith(0);
  });
});
