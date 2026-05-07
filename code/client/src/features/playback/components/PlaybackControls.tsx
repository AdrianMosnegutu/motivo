import { Pause, Play, RotateCcw, Square } from 'lucide-react';

import type { PlayState } from '../types';

import PlaybackButton from './PlaybackButton';

interface PlaybackControlsProps {
  canPlay: boolean;
  playState: PlayState;
  onPause: () => void;
  onPlay: () => void;
  onRewind: () => void;
  onStop: () => void;
}

export default function PlaybackControls({
  canPlay,
  playState,
  onPause,
  onPlay,
  onRewind,
  onStop,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <PlaybackButton
        onClick={onRewind}
        disabled={!canPlay}
        enabled={canPlay}
        title="Rewind to start"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </PlaybackButton>
      <PlaybackButton
        onClick={playState === 'playing' ? onPause : onPlay}
        disabled={!canPlay}
        enabled={canPlay}
        title={playState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
      >
        {playState === 'playing' ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </PlaybackButton>
      <PlaybackButton
        onClick={onStop}
        disabled={playState === 'stopped'}
        enabled={playState !== 'stopped'}
        title="Stop"
      >
        <Square className="w-3.5 h-3.5" />
      </PlaybackButton>
    </div>
  );
}
