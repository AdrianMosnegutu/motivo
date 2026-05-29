import { describe, expect, it } from 'vitest';

import {
  buildDrumNoteResolver,
  GM_HI_HAT_MIDI,
  HI_HAT_VELOCITY_GAIN,
  scaleDrumVelocity,
} from '@/features/playback/lib/drum-note-map';

describe('buildDrumNoteResolver', () => {
  it('maps GM pitches to LM-2 group names', () => {
    const resolve = buildDrumNoteResolver([
      'cabasa',
      'clap',
      'conga',
      'cowbell',
      'crash',
      'hhclosed',
      'hhopen',
      'kick',
      'ride',
      'snare',
      'stick',
      'tambourine',
      'tom',
    ]);

    expect(resolve(36)).toBe('kick');
    expect(resolve(38)).toBe('snare');
    expect(resolve(42)).toBe('hhclosed');
    expect(resolve(49)).toBe('crash');
    expect(resolve(51)).toBe('ride');
  });

  it('maps GM pitches to Roland CR-8000 group names', () => {
    const resolve = buildDrumNoteResolver([
      'clap',
      'clave',
      'conga',
      'cowbell',
      'cymball',
      'hihat',
      'kick',
      'rimshot',
      'snare',
      'tom',
    ]);

    expect(resolve(36)).toBe('kick');
    expect(resolve(38)).toBe('snare');
    expect(resolve(42)).toBe('hihat');
    expect(resolve(49)).toBe('cymball');
    expect(resolve(51)).toBe('rimshot');
  });

  it('passes through unknown MIDI when the kit has no matching group', () => {
    const resolve = buildDrumNoteResolver(['kick', 'snare']);
    expect(resolve(42)).toBe(42);
  });

  it('reduces hi-hat velocity relative to other drums', () => {
    expect(scaleDrumVelocity(GM_HI_HAT_MIDI, 1)).toBe(HI_HAT_VELOCITY_GAIN);
    expect(scaleDrumVelocity(36, 1)).toBe(1);
  });
});
