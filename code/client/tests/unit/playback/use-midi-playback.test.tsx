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
const loadPlaybackInstrument = vi.fn();
const createSharedSampleLoader = vi.fn(() => ({}));
const playNote = vi.fn(() => ({ stop: vi.fn() }));
const playerStop = vi.fn();

vi.mock('@/features/playback/lib/instruments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/playback/lib/instruments')>();
  return {
    ...actual,
    createSharedSampleLoader: () => createSharedSampleLoader(),
    loadPlaybackInstrument: (...args: unknown[]) => loadPlaybackInstrument(...args),
  };
});

vi.mock('tone', () => ({
  getContext: () => ({
    rawContext: {
      currentTime: 1,
    },
  }),
  getTransport: () => transport,
  start: () => toneStart(),
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
    loadPlaybackInstrument.mockResolvedValue({ playNote, stop: playerStop });
    playNote.mockClear();
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
    expect(playNote).toHaveBeenCalledWith({
      midi: 60,
      when: expect.any(Number),
      duration: 1,
      velocity: 0.8,
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
    loadPlaybackInstrument.mockRejectedValueOnce(new Error('instrument unavailable'));
    const { result } = renderHook(() => useMidiPlayback(parsedMidi as never));

    await waitFor(() => expect(result.current.loadState).toBe('error'));
  });
});
