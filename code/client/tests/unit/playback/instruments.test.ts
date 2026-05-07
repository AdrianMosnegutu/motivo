import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INSTRUMENT,
  PERCUSSION_INSTRUMENT,
  resolveInstrument,
} from '@/features/playback/lib/instruments';

describe('resolveInstrument', () => {
  it('maps General MIDI program ranges to soundfont instruments', () => {
    expect(resolveInstrument(0, 0)).toBe('acoustic_grand_piano');
    expect(resolveInstrument(28, 0)).toBe('acoustic_guitar_nylon');
    expect(resolveInstrument(65, 0)).toBe('alto_sax');
  });

  it('uses percussion for drum channels', () => {
    expect(resolveInstrument(0, 9)).toBe(PERCUSSION_INSTRUMENT);
    expect(resolveInstrument(0, 10)).toBe(PERCUSSION_INSTRUMENT);
  });

  it('falls back for unmapped programs', () => {
    expect(resolveInstrument(120, 0)).toBe(DEFAULT_INSTRUMENT);
  });
});
