import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadMidi, midiFilenameFromDocumentName } from '@/features/playback/lib/download-midi';

describe('midiFilenameFromDocumentName', () => {
  it('derives a .mid name from a .motivo document', () => {
    expect(midiFilenameFromDocumentName('example.motivo')).toBe('example.mid');
    expect(midiFilenameFromDocumentName('unsaved')).toBe('unsaved.mid');
  });
});

describe('downloadMidi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends a link, clicks it, and revokes the blob URL', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window, 'setTimeout').mockImplementation((fn) => {
      if (typeof fn === 'function') fn();
      return 0 as never;
    });

    const click = vi.fn();
    const append = vi.spyOn(document.body, 'append');
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove');
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = click;
      }
      return element;
    });

    downloadMidi(new Uint8Array([1, 2, 3]), 'song.mid');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(append).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
