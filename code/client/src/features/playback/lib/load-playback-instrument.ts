import type { SampleLoader } from 'smplr';

import type { PlaybackPlayer } from '../types';

import { DEFAULT_DRUM_MACHINE, PERCUSSION_INSTRUMENT } from './instruments';
import {
  createSharedSampleLoader,
  loadSmplrDrumMachine,
  loadSmplrSoundfont,
} from './playback-players';

export async function loadPlaybackInstrument(
  audioContext: AudioContext,
  instrumentName: string,
  loader: SampleLoader,
): Promise<PlaybackPlayer> {
  if (instrumentName === PERCUSSION_INSTRUMENT) {
    return loadSmplrDrumMachine(audioContext, DEFAULT_DRUM_MACHINE, loader);
  }
  return loadSmplrSoundfont(audioContext, instrumentName, loader);
}

export { createSharedSampleLoader };
