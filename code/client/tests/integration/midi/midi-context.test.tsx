import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MidiProvider, useMidi } from '@/features/midi/MidiContext';

vi.mock('@/features/midi/parse-midi', () => ({
  parseMidiBytes: vi.fn((bytes: Uint8Array | null) => (bytes ? { tracks: [{ notes: [] }] } : null)),
}));

function Consumer() {
  const { parsedMidi } = useMidi();
  return <div>{parsedMidi ? 'parsed' : 'empty'}</div>;
}

describe('MidiContext', () => {
  it('provides parsed MIDI state', () => {
    render(
      <MidiProvider>
        <Consumer />
      </MidiProvider>,
    );

    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('rejects consumers outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('useMidi must be used within MidiProvider');
    vi.mocked(console.error).mockRestore();
  });
});
