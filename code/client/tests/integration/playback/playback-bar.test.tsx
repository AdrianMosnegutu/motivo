import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';
import type { useMidi } from '@/features/midi/MidiContext';
import PlaybackBar from '@/features/playback/components/PlaybackBar';

function renderBar(ui: ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const downloadMidi = vi.fn();
const useMidiPlayback = vi.fn();
let midiState: ReturnType<typeof useMidi>;

vi.mock('@/features/midi/MidiContext', () => ({
  useMidi: () => midiState,
}));

vi.mock('@/features/playback/hooks/useMidiPlayback', () => ({
  useMidiPlayback: (...args: unknown[]) => useMidiPlayback(...args),
}));

vi.mock('@/features/playback/hooks/usePlaybackShortcut', () => ({
  usePlaybackShortcut: vi.fn(),
}));

vi.mock('@/features/playback/lib/download-midi', () => ({
  downloadMidi: (...args: unknown[]) => downloadMidi(...args),
}));

describe('PlaybackBar', () => {
  beforeEach(() => {
    midiState = {
      midiBytes: new Uint8Array([1, 2]),
      parsedMidi: { duration: 4, tracks: [] } as unknown as ReturnType<
        typeof useMidi
      >['parsedMidi'],
      setMidiBytes: vi.fn(),
    };
    useMidiPlayback.mockReturnValue({
      canPlay: true,
      currentSeconds: 0,
      handlePause: vi.fn(),
      handlePlay: vi.fn(),
      handleRewind: vi.fn(),
      handleSeek: vi.fn(),
      loadState: 'ready',
      playState: 'stopped',
      stopAll: vi.fn(),
    });
    downloadMidi.mockReset();
  });

  it('asks the user to compile before playback exists', () => {
    midiState.parsedMidi = null;
    renderBar(<PlaybackBar />);

    expect(screen.getByText('Compile successfully to enable playback')).toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    useMidiPlayback.mockReturnValueOnce({
      ...useMidiPlayback(),
      loadState: 'loading',
    });
    const { rerender } = renderBar(<PlaybackBar />);
    expect(screen.getByText('Loading sounds...')).toBeInTheDocument();

    useMidiPlayback.mockReturnValueOnce({
      ...useMidiPlayback(),
      loadState: 'error',
    });
    rerender(<TooltipProvider>{<PlaybackBar />}</TooltipProvider>);
    expect(screen.getByText('Instrument Error')).toBeInTheDocument();
  });

  it('downloads the current MIDI bytes', () => {
    renderBar(<PlaybackBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Export MIDI' }));
    expect(downloadMidi).toHaveBeenCalledWith(new Uint8Array([1, 2]));
  });

  it('stops playback and resets position', () => {
    const stopAll = vi.fn();
    useMidiPlayback.mockReturnValue({
      ...useMidiPlayback(),
      stopAll,
    });

    renderBar(<PlaybackBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(stopAll).toHaveBeenCalledTimes(1);
  });
});
