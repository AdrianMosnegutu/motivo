'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMidi } from '@/features/midi/MidiContext';
import { usePlaybackController } from '@/features/playback/PlaybackControllerContext';
import { cn } from '@/lib/utils';

import { usePlayheadTime } from '../hooks/usePlayheadTime';
import {
  calculateNoteRange,
  isBlackKey,
  midiToLabel,
  PIXELS_PER_SECOND,
  ROW_HEIGHT,
  trackColor,
} from '../lib/piano';

const KEYBOARD_WIDTH = 48;

export default function PianoRoll() {
  const { parsedMidi } = useMidi();
  const currentTime = usePlayheadTime();
  const { seek } = usePlaybackController();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

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

  const duration = parsedMidi?.duration ?? 0;
  const contentWidth = Math.max(duration * PIXELS_PER_SECOND, 240);
  const contentHeight = rows.length * ROW_HEIGHT;
  const playheadX = currentTime * PIXELS_PER_SECOND;

  const handleGridScroll = useCallback(() => {
    const grid = scrollRef.current;
    if (!grid) return;
    setScrollTop(grid.scrollTop);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cursorX = playheadX;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    if (cursorX < viewLeft || cursorX > viewRight) {
      el.scrollLeft = Math.max(0, cursorX - el.clientWidth / 2);
    }
    setScrollTop(el.scrollTop);
  }, [playheadX]);

  if (!parsedMidi) {
    return (
      <div className="flex h-full items-center justify-center bg-[#151921] px-4 text-center font-mono text-xs text-muted-foreground">
        Compile your code to see the visualizer
      </div>
    );
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    seek(Math.max(0, offsetX / PIXELS_PER_SECOND));
  };

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

      <div ref={scrollRef} className="min-w-0 flex-1 overflow-auto" onScroll={handleGridScroll}>
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

          {notes.map((note) => {
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
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-0 w-px bg-white shadow-[0_0_2.5px_rgba(255,255,255,0.5)]"
            style={{ left: playheadX }}
          >
            <div className="absolute -left-[5px] -top-px size-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
