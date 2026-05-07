import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlaybackBar from '@/features/playback/components/PlaybackBar';

const downloadMidi = vi.fn();
const useMidiPlayback = vi.fn();
let midiState: any;

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
      parsedMidi: { duration: 4, tracks: [] },
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
      position: '0.0s / 4.0s',
      stopAll: vi.fn(),
    });
    downloadMidi.mockReset();
  });

  it('asks the user to compile before playback exists', () => {
    midiState.parsedMidi = null;
    render(<PlaybackBar />);

    expect(screen.getByText('Compile successfully to enable playback')).toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    useMidiPlayback.mockReturnValueOnce({
      ...useMidiPlayback(),
      loadState: 'loading',
    });
    const { rerender } = render(<PlaybackBar />);
    expect(screen.getByText('Loading sounds...')).toBeInTheDocument();

    useMidiPlayback.mockReturnValueOnce({
      ...useMidiPlayback(),
      loadState: 'error',
    });
    rerender(<PlaybackBar />);
    expect(screen.getByText('Instrument Error')).toBeInTheDocument();
  });

  it('downloads the current MIDI bytes', () => {
    render(<PlaybackBar />);

    fireEvent.click(screen.getByRole('button', { name: /Download/ }));
    expect(downloadMidi).toHaveBeenCalledWith(new Uint8Array([1, 2]));
  });
});
