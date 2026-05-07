import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PlaybackButton from '@/features/playback/components/PlaybackButton';
import PlaybackControls from '@/features/playback/components/PlaybackControls';
import PlaybackProgress from '@/features/playback/components/PlaybackProgress';

describe('playback components', () => {
  it('renders enabled and disabled playback buttons', () => {
    const { rerender } = render(
      <PlaybackButton enabled title="Play">
        Play
      </PlaybackButton>,
    );

    expect(screen.getByTitle('Play')).toHaveClass('cursor-pointer');

    rerender(
      <PlaybackButton enabled={false} disabled title="Play">
        Play
      </PlaybackButton>,
    );

    expect(screen.getByTitle('Play')).toBeDisabled();
    expect(screen.getByTitle('Play')).toHaveClass('cursor-not-allowed');
  });

  it('routes playback control clicks to the right handlers', () => {
    const onPause = vi.fn();
    const onPlay = vi.fn();
    const onRewind = vi.fn();
    const onStop = vi.fn();

    render(
      <PlaybackControls
        canPlay
        playState="playing"
        onPause={onPause}
        onPlay={onPlay}
        onRewind={onRewind}
        onStop={onStop}
      />,
    );

    fireEvent.click(screen.getByTitle('Rewind to start'));
    fireEvent.click(screen.getByTitle('Pause (Space)'));
    fireEvent.click(screen.getByTitle('Stop'));

    expect(onRewind).toHaveBeenCalled();
    expect(onPause).toHaveBeenCalled();
    expect(onStop).toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('emits numeric seek values', () => {
    const onSeek = vi.fn();

    render(
      <PlaybackProgress currentSeconds={2} duration={8} position="2.0s / 8.0s" onSeek={onSeek} />,
    );

    fireEvent.change(screen.getByRole('slider'), { target: { value: '4.5' } });

    expect(screen.getByText('2.0s / 8.0s')).toBeInTheDocument();
    expect(onSeek).toHaveBeenCalledWith(4.5);
  });
});
