type GmEntry = [minProgram: number, maxProgram: number, instrumentName: string];

export const GM_INSTRUMENT_MAP: GmEntry[] = [
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

export function resolveInstrument(program: number, channel: number): string {
  if (channel === 9 || channel === 10) return PERCUSSION_INSTRUMENT;
  const entry = GM_INSTRUMENT_MAP.find(([min, max]) => program >= min && program <= max);
  return entry ? entry[2] : DEFAULT_INSTRUMENT;
}
