'use client';

import { useMidi } from '@/features/midi/MidiContext';
import Spinner from '@/shared/components/Spinner';

import { useMidiPlayback } from '../hooks/useMidiPlayback';
import { usePlaybackShortcut } from '../hooks/usePlaybackShortcut';
import { downloadMidi } from '../lib/download-midi';

import PlaybackControls from './PlaybackControls';
import PlaybackProgress from './PlaybackProgress';

export default function PlaybackBar() {
  const { midiBytes, parsedMidi } = useMidi();
  const playback = useMidiPlayback(parsedMidi);

  usePlaybackShortcut({
    playState: playback.playState,
    onPlay: playback.handlePlay,
    onPause: playback.handlePause,
  });

  if (!parsedMidi) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
        Compile successfully to enable playback
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 h-full bg-toolbar">
      {playback.loadState === 'loading' ? (
        <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
          <Spinner className="w-3 h-3" />
          <span className="hidden sm:inline">Loading sounds...</span>
        </div>
      ) : playback.loadState === 'error' ? (
        <div
          className="text-red-600 dark:text-red-500 font-mono text-xs truncate max-w-[120px]"
          title="Failed to load instruments"
        >
          Instrument Error
        </div>
      ) : (
        <PlaybackControls
          canPlay={playback.canPlay}
          playState={playback.playState}
          onPause={playback.handlePause}
          onPlay={playback.handlePlay}
          onRewind={playback.handleRewind}
          onStop={playback.stopAll}
        />
      )}

      <PlaybackProgress
        currentSeconds={playback.currentSeconds}
        duration={parsedMidi.duration}
        position={playback.position}
        onSeek={playback.handleSeek}
      />

      <button
        onClick={() => midiBytes && downloadMidi(midiBytes)}
        className="text-xs font-mono px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100 transition-colors border border-border shrink-0"
      >
        <span className="hidden sm:inline">Download .mid</span>
        <span className="sm:hidden">.mid</span>
      </button>
    </div>
  );
}
