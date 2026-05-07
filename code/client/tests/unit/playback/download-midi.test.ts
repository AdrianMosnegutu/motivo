import { describe, expect, it, vi } from 'vitest';

import { downloadMidi } from '@/features/playback/lib/download-midi';

describe('downloadMidi', () => {
  it('creates and revokes a MIDI blob URL', () => {
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = click;
      }
      return element;
    });

    downloadMidi(new Uint8Array([1, 2, 3]), 'song.mid');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

    createElement.mockRestore();
  });
});
