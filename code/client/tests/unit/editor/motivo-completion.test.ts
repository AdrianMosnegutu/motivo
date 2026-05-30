import { describe, expect, it } from 'vitest';

import { detectCompletionContext } from '@/features/editor/monaco/motivo-completion';

describe('detectCompletionContext', () => {
  it('suggests instruments after using', () => {
    expect(detectCompletionContext('track t using ')).toBe('instruments');
    expect(detectCompletionContext('track t using pi')).toBe('instruments');
  });

  it('suggests playables after play or inside chords', () => {
    expect(detectCompletionContext('    play ')).toBe('playables');
    expect(detectCompletionContext('    play [A4, ')).toBe('playables');
    expect(detectCompletionContext('    play kick')).toBe('playables');
  });

  it('suggests statements after block openings', () => {
    expect(detectCompletionContext('track t {')).toBe('statements');
    expect(detectCompletionContext('    play A4;')).toBe('statements');
  });

  it('falls back to general elsewhere', () => {
    expect(detectCompletionContext('tempo 12')).toBe('general');
  });
});
