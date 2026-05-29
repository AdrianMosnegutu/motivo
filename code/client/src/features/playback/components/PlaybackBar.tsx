'use client';

import { useEffect } from 'react';
import { FileDown, Pause, Play, Repeat, SkipBack, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMidi } from '@/features/midi/MidiContext';
import { cn } from '@/lib/utils';
import Spinner from '@/shared/components/Spinner';

import { useMidiPlayback } from '../hooks/useMidiPlayback';
import { usePlaybackShortcut } from '../hooks/usePlaybackShortcut';
import { downloadMidi, midiFilenameFromDocumentName } from '../lib/download-midi';
import { usePlaybackController } from '../PlaybackControllerContext';

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const HEADER_CLASS =
  'flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#2a303c] bg-[rgba(11,14,20,0.3)] px-4';

type PlaybackBarProps = {
  exportFilename?: string;
};

export default function PlaybackBar({ exportFilename }: PlaybackBarProps) {
  const { midiBytes, parsedMidi } = useMidi();
  const playback = useMidiPlayback(parsedMidi);
  const { registerSeek } = usePlaybackController();

  usePlaybackShortcut({
    playState: playback.playState,
    onPlay: playback.handlePlay,
    onPause: playback.handlePause,
  });

  useEffect(() => {
    registerSeek(playback.handleSeek);
  }, [playback.handleSeek, registerSeek]);

  if (!parsedMidi) {
    return (
      <div className={cn(HEADER_CLASS, 'justify-center')}>
        <span className="font-mono text-xs text-muted-foreground">
          Compile successfully to enable playback
        </span>
      </div>
    );
  }

  const isPlaying = playback.playState === 'playing';

  return (
    <div className={HEADER_CLASS}>
      {playback.loadState === 'loading' ? (
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Spinner className="size-3" />
          <span className="hidden sm:inline">Loading sounds...</span>
        </div>
      ) : playback.loadState === 'error' ? (
        <div className="font-mono text-xs text-destructive" title="Failed to load instruments">
          Instrument Error
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-[#2a303c] bg-[#0b0e14] p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rewind to start"
                disabled={!playback.canPlay}
                onClick={playback.handleRewind}
                className="text-[#e2e8f0] hover:bg-muted"
              >
                <SkipBack aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rewind to start</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={!playback.canPlay}
                onClick={isPlaying ? playback.handlePause : playback.handlePlay}
                className="h-8 w-10 rounded-md bg-[#38bdf8] text-[#0b0e14] shadow-[0_0_5px_rgba(56,189,248,0.4)] hover:bg-[#38bdf8]/90"
              >
                {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Stop"
                disabled={!playback.canPlay}
                onClick={playback.stopAll}
                className="text-[#e2e8f0] hover:bg-muted"
              >
                <Square aria-hidden className="fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Loop"
                aria-pressed={playback.loop}
                onClick={playback.toggleLoop}
                className={cn(
                  playback.loop
                    ? 'bg-[#38bdf8] text-[#0b0e14] shadow-[0_0_5px_rgba(56,189,248,0.4)] hover:!bg-[#7dd3fc] hover:!text-[#0b0e14]'
                    : 'text-[#94a3b8] hover:!bg-[#2a303c] hover:!text-[#e2e8f0]',
                )}
              >
                <Repeat aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{playback.loop ? 'Loop on' : 'Loop off'}</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="rounded-md border border-[#2a303c] bg-[#0b0e14] px-3 py-1.5 font-mono text-[14px] font-medium tabular-nums">
        <span className="text-white">{formatTime(playback.currentSeconds)}</span>
        <span className="text-[#94a3b8]"> / {formatTime(parsedMidi.duration)}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!midiBytes}
        onClick={() => {
          if (!midiBytes) return;
          downloadMidi(midiBytes, midiFilenameFromDocumentName(exportFilename));
        }}
        aria-label="Export MIDI"
        className="h-auto gap-2 rounded-lg border-[#2a303c] bg-[#0b0e14] px-3 py-2 text-[12px] font-medium text-[#e2e8f0] hover:bg-muted"
      >
        <FileDown aria-hidden data-icon="inline-start" />
        Export MIDI
      </Button>
    </div>
  );
}
