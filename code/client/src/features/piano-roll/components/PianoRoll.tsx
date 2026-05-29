'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';

import { useMidi } from '@/features/midi/MidiContext';
import { usePlaybackController } from '@/features/playback/PlaybackControllerContext';
import { cn } from '@/lib/utils';

import { usePlayheadTracker } from '../hooks/usePlayheadTime';
import {
  calculateNoteRange,
  isBlackKey,
  midiToLabel,
  NOTE_BUFFER_AHEAD_SEC,
  NOTE_BUFFER_BEHIND_SEC,
  PIXELS_PER_SECOND,
  ROW_HEIGHT,
  trackColor,
} from '../lib/piano';

const KEYBOARD_WIDTH = 48;

type ViewportState = {
  left: number;
  width: number;
  playheadSec: number;
};

export default function PianoRoll() {
  const { parsedMidi } = useMidi();
  const { seek } = usePlaybackController();
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const followPlayheadRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const lastManualScrollAtRef = useRef(0);
  const manualScrollIdleMsRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState<ViewportState>({
    left: 0,
    width: 0,
    playheadSec: 0,
  });

  const { minMidi, maxMidi } = useMemo(
    () => calculateNoteRange(parsedMidi?.tracks ?? null),
    [parsedMidi],
  );

  const rows = useMemo(() => {
    const list: number[] = [];
    for (let midi = maxMidi; midi >= minMidi; midi--) list.push(midi);
    return list;
  }, [maxMidi, minMidi]);

  const notes = useMemo(() => {
    if (!parsedMidi) return [];
    return parsedMidi.tracks.flatMap((track, trackIndex) =>
      track.notes.map((note, noteIndex) => ({
        key: `${trackIndex}-${noteIndex}`,
        trackIndex,
        midi: note.midi,
        time: note.time,
        duration: note.duration,
      })),
    );
  }, [parsedMidi]);

  const visibleNotes = useMemo(() => {
    if (viewport.width <= 0) return notes;

    const scrollStartSec = viewport.left / PIXELS_PER_SECOND;
    const scrollEndSec = (viewport.left + viewport.width) / PIXELS_PER_SECOND;
    const start = scrollStartSec - NOTE_BUFFER_BEHIND_SEC;
    const end = Math.max(
      scrollEndSec + NOTE_BUFFER_AHEAD_SEC,
      viewport.playheadSec + NOTE_BUFFER_AHEAD_SEC,
    );

    return notes.filter((note) => note.time + note.duration >= start && note.time <= end);
  }, [notes, viewport.left, viewport.playheadSec, viewport.width]);

  const duration = parsedMidi?.duration ?? 0;
  const contentWidth = Math.max(duration * PIXELS_PER_SECOND, 240);
  const contentHeight = rows.length * ROW_HEIGHT;

  const syncViewport = useCallback(() => {
    const grid = scrollRef.current;
    if (!grid) return;
    setScrollTop(grid.scrollTop);
    setViewport({
      left: grid.scrollLeft,
      width: grid.clientWidth,
      playheadSec: Tone.getTransport().seconds,
    });
  }, []);

  const handleGridScroll = useCallback(() => {
    if (programmaticScrollRef.current) {
      programmaticScrollRef.current = false;
    } else {
      followPlayheadRef.current = false;
      lastManualScrollAtRef.current = 1;
      manualScrollIdleMsRef.current = 0;
    }
    syncViewport();
  }, [syncViewport]);

  useEffect(() => {
    const grid = scrollRef.current;
    if (!grid) return;

    syncViewport();
    const observer = new ResizeObserver(syncViewport);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [syncViewport, parsedMidi]);

  usePlayheadTracker(scrollRef, playheadRef, {
    followPlayheadRef,
    lastManualScrollAtRef,
    manualScrollIdleMsRef,
    programmaticScrollRef,
    onViewportChange: syncViewport,
  });

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const seekTime = Math.max(0, offsetX / PIXELS_PER_SECOND);
    seek(seekTime);
    followPlayheadRef.current = true;
    lastManualScrollAtRef.current = 0;
    manualScrollIdleMsRef.current = 0;

    const grid = scrollRef.current;
    if (grid) {
      const playheadX = seekTime * PIXELS_PER_SECOND;
      programmaticScrollRef.current = true;
      grid.scrollLeft = Math.max(0, playheadX - grid.clientWidth / 2);
      syncViewport();
    }
  };

  if (!parsedMidi) {
    return (
      <div className="flex h-full items-center justify-center bg-[#151921] px-4 text-center font-mono text-xs text-muted-foreground">
        Compile your code to see the visualizer
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#151921]">
      <div
        className="shrink-0 overflow-hidden border-r border-[#2a303c] bg-[#0b0e14]"
        style={{ width: KEYBOARD_WIDTH }}
      >
        <div
          style={{
            height: contentHeight,
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {rows.map((midi) => (
            <div
              key={midi}
              className={cn(
                'flex items-center justify-end border-b border-[#11151c] pr-1',
                isBlackKey(midi) ? 'bg-[#0b0e14]' : 'bg-[#232a36]',
              )}
              style={{ height: ROW_HEIGHT }}
            >
              <span
                className={cn(
                  'text-[10px] leading-none font-normal',
                  isBlackKey(midi) ? 'text-[#8b95a8]' : 'text-white',
                )}
              >
                {midiToLabel(midi)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-w-0 flex-1 overflow-auto"
        onScroll={handleGridScroll}
      >
        <div
          className="relative shrink-0 cursor-pointer"
          onClick={handleSeek}
          style={{
            width: contentWidth,
            height: contentHeight,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${ROW_HEIGHT - 1}px, rgba(42,48,60,0.6) ${ROW_HEIGHT - 1}px ${ROW_HEIGHT}px), repeating-linear-gradient(to right, transparent 0 ${PIXELS_PER_SECOND - 1}px, rgba(42,48,60,0.4) ${PIXELS_PER_SECOND - 1}px ${PIXELS_PER_SECOND}px)`,
          }}
        >
          {rows.map((midi, index) =>
            isBlackKey(midi) ? (
              <div
                key={midi}
                aria-hidden
                className="absolute inset-x-0 bg-[rgba(0,0,0,0.32)]"
                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            ) : null,
          )}

          {visibleNotes.map((note) => {
            const color = trackColor(note.trackIndex);
            return (
              <div
                key={note.key}
                className="absolute rounded-[2px] border border-white/20"
                style={{
                  left: note.time * PIXELS_PER_SECOND,
                  top: (maxMidi - note.midi) * ROW_HEIGHT + 2,
                  width: Math.max(note.duration * PIXELS_PER_SECOND - 1, 4),
                  height: ROW_HEIGHT - 4,
                  backgroundColor: color,
                  backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)`,
                  boxShadow: `0 0 6px ${color}40`,
                }}
              />
            );
          })}

          <div
            ref={playheadRef}
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 top-0 w-px bg-white shadow-[0_0_2.5px_rgba(255,255,255,0.5)] will-change-transform"
            style={{ transform: 'translateX(0px)' }}
          >
            <div className="absolute -left-[5px] -top-px size-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
