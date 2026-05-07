import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMidiPlayback } from '@/features/playback/hooks/useMidiPlayback';

const transport = {
  pause: vi.fn(),
  seconds: 0,
  start: vi.fn(),
  stop: vi.fn(),
};
const toneStart = vi.fn();
const instrument = vi.fn();
const play = vi.fn(() => ({ stop: vi.fn() }));
const playerStop = vi.fn();

vi.mock('tone', () => ({
  Frequency: (midi: number) => ({
    toNote: () => `note-${midi}`,
  }),
  getContext: () => ({
    rawContext: {
      currentTime: 1,
    },
  }),
  getTransport: () => transport,
  start: () => toneStart(),
}));

vi.mock('soundfont-player', () => ({
  default: {
    instrument: (...args: unknown[]) => instrument(...args),
  },
}));

const parsedMidi = {
  duration: 4,
  tracks: [
    {
      channel: 0,
      instrument: { number: 0 },
      notes: [
        {
          duration: 1,
          midi: 60,
          time: 0,
          velocity: 0.8,
        },
      ],
    },
  ],
};

describe('useMidiPlayback', () => {
  beforeEach(() => {
    transport.pause.mockClear();
    transport.seconds = 0;
    transport.start.mockClear();
    transport.stop.mockClear();
    toneStart.mockResolvedValue(undefined);
    instrument.mockResolvedValue({ play, stop: playerStop });
    play.mockClear();
    playerStop.mockClear();
  });

  it('stays idle when no MIDI is available', () => {
    const { result } = renderHook(() => useMidiPlayback(null));

    expect(result.current.loadState).toBe('idle');
    expect(result.current.canPlay).toBe(false);
  });

  it('loads instruments and controls playback', async () => {
    const { result } = renderHook(() => useMidiPlayback(parsedMidi as never));

    await waitFor(() => expect(result.current.loadState).toBe('ready'));

    await act(async () => {
      await result.current.handlePlay();
    });

    expect(toneStart).toHaveBeenCalled();
    expect(transport.start).toHaveBeenCalled();
    expect(play).toHaveBeenCalledWith('note-60', expect.any(Number), {
      duration: 1,
      gain: 0.8,
    });
    expect(result.current.playState).toBe('playing');

    act(() => result.current.handlePause());
    expect(transport.pause).toHaveBeenCalled();
    expect(result.current.playState).toBe('paused');

    act(() => result.current.handleSeek(2));
    expect(transport.seconds).toBe(2);

    act(() => result.current.stopAll());
    expect(transport.stop).toHaveBeenCalled();
    expect(result.current.playState).toBe('stopped');
  });

  it('reports instrument loading failures', async () => {
    instrument.mockRejectedValueOnce(new Error('soundfont unavailable'));
    const { result } = renderHook(() => useMidiPlayback(parsedMidi as never));

    await waitFor(() => expect(result.current.loadState).toBe('error'));
  });
});
