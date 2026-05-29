import { beforeEach, describe, expect, it, vi } from 'vitest';

const soundfont = vi.fn();
const drumMachine = vi.fn();
const sampleLoader = vi.fn();

vi.mock('smplr', () => ({
  DrumMachine: (...args: unknown[]) => drumMachine(...args),
  SampleLoader: (...args: unknown[]) => sampleLoader(...args),
  Soundfont: (...args: unknown[]) => soundfont(...args),
}));

import { DEFAULT_DRUM_MACHINE, PERCUSSION_INSTRUMENT } from '@/features/playback/lib/instruments';
import { loadPlaybackInstrument } from '@/features/playback/lib/load-playback-instrument';
import { SMPLR_SOUNDFONT_KIT } from '@/features/playback/lib/playback-players';

describe('loadPlaybackInstrument', () => {
  const audioContext = {} as AudioContext;
  const loader = { tag: 'loader' } as never;

  const readyInstrument = {
    ready: Promise.resolve(),
    start: vi.fn(() => vi.fn()),
    stop: vi.fn(),
    getGroupNames: () => ['kick', 'snare', 'hihat', 'cymball', 'rimshot'],
  };

  beforeEach(() => {
    soundfont.mockReset();
    drumMachine.mockReset();
    sampleLoader.mockReset();
    soundfont.mockReturnValue(readyInstrument);
    drumMachine.mockReturnValue(readyInstrument);
  });

  it('loads melodic instruments via smplr Soundfont', async () => {
    await loadPlaybackInstrument(audioContext, 'acoustic_grand_piano', loader);

    expect(soundfont).toHaveBeenCalledWith(audioContext, {
      kit: SMPLR_SOUNDFONT_KIT,
      instrument: 'acoustic_grand_piano',
      loader,
    });
    expect(drumMachine).not.toHaveBeenCalled();
  });

  it('loads percussion via smplr DrumMachine', async () => {
    await loadPlaybackInstrument(audioContext, PERCUSSION_INSTRUMENT, loader);

    expect(drumMachine).toHaveBeenCalledWith(audioContext, {
      instrument: DEFAULT_DRUM_MACHINE,
      loader,
    });
    expect(soundfont).not.toHaveBeenCalled();
  });
});
