import { DrumMachine, SampleLoader, type Smplr, Soundfont } from 'smplr';

import type { PlaybackPlayer } from '../types';

import { buildDrumNoteResolver, scaleDrumVelocity } from './drum-note-map';

export const SMPLR_SOUNDFONT_KIT = 'MusyngKite';

export function wrapSmplrInstrument(instrument: Smplr): PlaybackPlayer {
  return {
    playNote({ midi, when, duration, velocity }) {
      const stopFn = instrument.start({
        note: midi,
        time: when,
        duration,
        velocity: Math.max(1, Math.round(velocity * 127)),
      });
      return { stop: (time) => stopFn(time) };
    },
    stop(when) {
      instrument.stop(when);
    },
  };
}

export function wrapSmplrDrumMachine(
  drums: Smplr & { getGroupNames(): string[] },
  resolveNote: (midi: number) => string | number,
): PlaybackPlayer {
  return {
    playNote({ midi, when, duration, velocity }) {
      const scaled = scaleDrumVelocity(midi, velocity);
      const stopFn = drums.start({
        note: resolveNote(midi),
        time: when,
        duration,
        velocity: Math.max(1, Math.round(scaled * 127)),
      });
      return { stop: (time) => stopFn(time) };
    },
    stop(when) {
      drums.stop(when);
    },
  };
}

export async function loadSmplrSoundfont(
  audioContext: AudioContext,
  instrumentName: string,
  loader: SampleLoader,
): Promise<PlaybackPlayer> {
  const instrument = Soundfont(audioContext, {
    kit: SMPLR_SOUNDFONT_KIT,
    instrument: instrumentName,
    loader,
  });
  await instrument.ready;
  return wrapSmplrInstrument(instrument);
}

export async function loadSmplrDrumMachine(
  audioContext: AudioContext,
  machineId: string,
  loader: SampleLoader,
): Promise<PlaybackPlayer> {
  const drums = DrumMachine(audioContext, { instrument: machineId, loader });
  await drums.ready;
  const resolveNote = buildDrumNoteResolver(drums.getGroupNames());
  return wrapSmplrDrumMachine(drums, resolveNote);
}

export function createSharedSampleLoader(audioContext: AudioContext): SampleLoader {
  return SampleLoader(audioContext);
}
