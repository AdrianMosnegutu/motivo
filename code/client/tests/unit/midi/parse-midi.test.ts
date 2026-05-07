import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseMidiBytes, toArrayBuffer } from '@/features/midi/parse-midi';

const midiConstructor = vi.fn();

vi.mock('@tonejs/midi', () => ({
  Midi: function Midi(buffer: ArrayBuffer) {
    return midiConstructor(buffer);
  },
}));

describe('MIDI parsing', () => {
  beforeEach(() => {
    midiConstructor.mockReset();
  });

  it('returns null for missing bytes', () => {
    expect(parseMidiBytes(null)).toBeNull();
  });

  it('parses byte slices into standalone ArrayBuffers', () => {
    const bytes = new Uint8Array([0, 1, 2, 3]).subarray(1, 3);
    midiConstructor.mockReturnValue({ tracks: [] });

    expect(toArrayBuffer(bytes).byteLength).toBe(2);
    expect(parseMidiBytes(bytes)).toEqual({ tracks: [] });
    expect(midiConstructor).toHaveBeenCalledWith(expect.any(ArrayBuffer));
  });

  it('returns null for invalid MIDI bytes', () => {
    midiConstructor.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(parseMidiBytes(new Uint8Array([1]))).toBeNull();
  });
});
