import { describe, expect, it, vi } from 'vitest';

import { API_ROUTES } from '@/config/app';
import { compileSource } from '@/features/compile/compile-client';

function jsonBuffer(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe('compileSource', () => {
  it('returns MIDI bytes for successful responses', async () => {
    const post = vi.fn().mockResolvedValue({
      status: 200,
      data: new Uint8Array([0x4d, 0x54, 0x68, 0x64]).buffer,
    });

    const result = await compileSource('track {}', { post });

    expect(post).toHaveBeenCalledWith(
      API_ROUTES.compile,
      { source: 'track {}' },
      expect.objectContaining({ responseType: 'arraybuffer' }),
    );
    expect(result).toEqual({
      kind: 'success',
      midiBytes: new Uint8Array([0x4d, 0x54, 0x68, 0x64]),
    });
  });

  it('normalizes compiler diagnostics from the server response', async () => {
    const diagnostics = [
      {
        severity: 'error',
        type: 'semantic',
        message: 'unknown identifier',
        location: '3:5',
        line: 3,
        column: 5,
      },
    ];
    const post = vi.fn().mockResolvedValue({
      status: 400,
      data: jsonBuffer({ kind: 'error', diagnostics }),
    });

    await expect(compileSource('bad', { post })).resolves.toEqual({
      kind: 'error',
      diagnostics,
    });
  });

  it('normalizes standard API errors into internal diagnostics', async () => {
    const post = vi.fn().mockResolvedValue({
      status: 500,
      data: jsonBuffer({
        error: {
          code: 'COMPILER_BINARY_NOT_FOUND',
          message: 'compiler binary not found',
        },
      }),
    });

    await expect(compileSource('track {}', { post })).resolves.toEqual({
      kind: 'error',
      diagnostics: [
        {
          severity: 'error',
          type: 'internal',
          message: 'compiler binary not found',
        },
      ],
    });
  });

  it('returns a network diagnostic when axios rejects', async () => {
    const post = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(compileSource('track {}', { post })).resolves.toEqual({
      kind: 'error',
      diagnostics: [
        {
          severity: 'error',
          type: 'internal',
          message: 'Network error: could not reach backend',
        },
      ],
    });
  });
});
