import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { useMidi } from '@/features/midi/MidiContext';
import PianoRoll from '@/features/piano-roll/components/PianoRoll';

const renderPianoRollFrame = vi.fn();
let midiState: ReturnType<typeof useMidi>;

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}));

vi.mock('@/features/midi/MidiContext', () => ({
  useMidi: () => midiState,
}));

vi.mock('@/features/piano-roll/hooks/useCanvasSize', () => ({
  useCanvasSize: () => ({ width: 400, height: 200 }),
}));

vi.mock('@/features/piano-roll/hooks/usePlayheadTime', () => ({
  usePlayheadTime: () => 1,
}));

vi.mock('@/features/piano-roll/lib/render-frame', () => ({
  renderPianoRollFrame: (...args: unknown[]) => renderPianoRollFrame(...args),
}));

describe('PianoRoll', () => {
  beforeEach(() => {
    renderPianoRollFrame.mockReset();
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({}) as CanvasRenderingContext2D,
    ) as unknown as HTMLCanvasElement['getContext'];
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

  it('renders a canvas frame when MIDI is available', () => {
    midiState = {
      midiBytes: null,
      parsedMidi: {
        tracks: [{ notes: [{ midi: 60 }] }],
      } as ReturnType<typeof useMidi>['parsedMidi'],
      setMidiBytes: vi.fn(),
    };

    render(<PianoRoll />);

    expect(renderPianoRollFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTime: 1,
        width: 400,
        height: 200,
        theme: 'dark',
      }),
    );
  });
});
