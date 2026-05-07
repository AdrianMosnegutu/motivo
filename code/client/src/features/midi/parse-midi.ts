import { Midi } from '@tonejs/midi';

export function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function parseMidiBytes(bytes: Uint8Array | null) {
  if (!bytes) return null;

  try {
    return new Midi(toArrayBuffer(bytes));
  } catch {
    return null;
  }
}
