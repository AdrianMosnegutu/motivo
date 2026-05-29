import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { useMidi } from '@/features/midi/MidiContext';
import PianoRoll from '@/features/piano-roll/components/PianoRoll';

let midiState: ReturnType<typeof useMidi>;

vi.mock('@/features/midi/MidiContext', () => ({
  useMidi: () => midiState,
}));

vi.mock('@/features/piano-roll/hooks/usePlayheadTime', () => ({
  usePlayheadTime: () => 1,
}));

describe('PianoRoll', () => {
  beforeEach(() => {
    midiState = {
      midiBytes: null,
      parsedMidi: null,
      setMidiBytes: vi.fn(),
    };
  });

  it('shows an empty state without parsed MIDI', () => {
    render(<PianoRoll />);
    expect(screen.getByText('Compile your code to see the visualizer')).toBeInTheDocument();
  });

  it('renders keyboard labels for the parsed MIDI range', () => {
    midiState = {
      midiBytes: null,
      parsedMidi: {
        duration: 2,
        tracks: [{ notes: [{ midi: 60, time: 0, duration: 1 }] }],
      } as unknown as ReturnType<typeof useMidi>['parsedMidi'],
      setMidiBytes: vi.fn(),
    };

    render(<PianoRoll />);

    expect(screen.queryByText('Compile your code to see the visualizer')).not.toBeInTheDocument();
    expect(screen.getByText('C4')).toBeInTheDocument();
  });
});
