/**
 * Motivo emits standard GM drum pitches (see compiler `DrumNote`).
 * smplr DrumMachine kits assign MIDI 36+ in sample-list order, not GM layout.
 * Each kit uses different group names — resolve at load time from `getGroupNames()`.
 */
/** Motivo `hihat` → GM closed hi-hat (compiler `DrumNote::Hihat`). */
export const GM_HI_HAT_MIDI = 42;

/** Hi-hat samples in smplr kits tend to be hot; scale velocity before playback. */
export const HI_HAT_VELOCITY_GAIN = 0.35;

export const MOTIVO_GM_DRUM_CANDIDATES: Record<number, readonly string[]> = {
  36: ['kick'],
  38: ['snare'],
  42: ['hihat', 'hhclosed', 'hihat-close', 'hihat-closed', 'hhclosed-short'],
  49: ['crash', 'cymbal', 'cymball'],
  51: ['ride', 'rimshot'],
};

export function buildDrumNoteResolver(
  groupNames: readonly string[],
): (midi: number) => string | number {
  const groups = new Set(groupNames);
  const resolved: Record<number, string> = {};

  for (const [midiKey, candidates] of Object.entries(MOTIVO_GM_DRUM_CANDIDATES)) {
    const midi = Number(midiKey);
    const match = candidates.find((name) => groups.has(name));
    if (match) resolved[midi] = match;
  }

  return (midi) => resolved[midi] ?? midi;
}

export function scaleDrumVelocity(midi: number, velocity: number): number {
  if (midi === GM_HI_HAT_MIDI) return velocity * HI_HAT_VELOCITY_GAIN;
  return velocity;
}
