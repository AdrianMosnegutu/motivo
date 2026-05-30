export const GM_INSTRUMENT_MAP: [minProgram: number, maxProgram: number, instrumentName: string][] =
  [
    [0, 7, 'acoustic_grand_piano'],
    [8, 15, 'celesta'],
    [16, 23, 'church_organ'],
    [24, 31, 'acoustic_guitar_nylon'],
    [32, 39, 'acoustic_bass'],
    [40, 47, 'violin'],
    [48, 55, 'string_ensemble_1'],
    [56, 63, 'trumpet'],
    [64, 71, 'alto_sax'],
    [72, 79, 'flute'],
  ];

export const DEFAULT_INSTRUMENT = 'acoustic_grand_piano';
export const PERCUSSION_INSTRUMENT = 'percussion';

/** Linn LM-2 — neutral drum-machine kit (see `getDrumMachineNames()`). */
export const DEFAULT_DRUM_MACHINE = 'MFB-512';

export function isDrumChannel(channel: number): boolean {
  return channel === 9 || channel === 10;
}

export function resolveInstrument(
  program: number,
  channel: number,
  percussion = isDrumChannel(channel),
): string {
  if (percussion) return PERCUSSION_INSTRUMENT;
  const entry = GM_INSTRUMENT_MAP.find(([min, max]) => program >= min && program <= max);
  return entry ? entry[2] : DEFAULT_INSTRUMENT;
}

export { createSharedSampleLoader, loadPlaybackInstrument } from './load-playback-instrument';
