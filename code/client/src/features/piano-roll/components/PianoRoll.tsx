'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';

import { useMidi } from '@/features/midi/MidiContext';
import { usePlaybackController } from '@/features/playback/PlaybackControllerContext';
import { cn } from '@/lib/utils';

import { PianoRollLaneChrome, PianoRollNotes, PianoRollVerticalGrid } from './PianoRollLayers';
import { usePlayheadTracker } from '../hooks/usePlayheadTime';
import { buildTimelineGrid, filterVisibleGridLines } from '../lib/grid';
import {
  calculateNoteRange,
  clampFollowScrollLeft,
  isAutoFollowScroll,
  isBlackKey,
  isOctaveSeparatorBelowRow,
  KEYBOARD_LINE_EMPHASIS,
  KEYBOARD_LINE_ROW,
  midiToLabel,
  NOTE_BUFFER_AHEAD_SEC,
  NOTE_BUFFER_BEHIND_SEC,
  PIXELS_PER_SECOND,
  ROW_HEIGHT,
  VIEWPORT_SCROLL_DELTA_PX,
  VIEWPORT_SYNC_MS,
} from '../lib/piano';
import { findVisibleNoteRange } from '../lib/visible-range';

const KEYBOARD_WIDTH = 48;

type ViewportState = {
  left: number;
  width: number;
};

export default function PianoRoll() {
  const { parsedMidi } = useMidi();
  const { seek } = usePlaybackController();
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const followPlayheadRef = useRef(true);
  const autoScrollLeftRef = useRef(0);
  const lastManualScrollAtRef = useRef(0);
  const manualScrollIdleMsRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState<ViewportState>({ left: 0, width: 0 });
  const lastViewportPublishRef = useRef({ at: 0, left: -1, width: 0 });

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
    const list = parsedMidi.tracks.flatMap((track, trackIndex) =>
      track.notes.map((note, noteIndex) => ({
        key: `${trackIndex}-${noteIndex}`,
        trackIndex,
        midi: note.midi,
        time: note.time,
        duration: note.duration,
      })),
    );
    list.sort((a, b) => a.time - b.time || a.trackIndex - b.trackIndex);
    return list;
  }, [parsedMidi]);

  const scrollStartSec = viewport.left / PIXELS_PER_SECOND;
  const scrollEndSec = (viewport.left + viewport.width) / PIXELS_PER_SECOND;

  const visibleNotes = useMemo(() => {
    if (viewport.width <= 0) return notes;

    const start = scrollStartSec - NOTE_BUFFER_BEHIND_SEC;
    const end = scrollEndSec + NOTE_BUFFER_AHEAD_SEC;
    const { start: from, end: to } = findVisibleNoteRange(notes, start, end);
    return notes.slice(from, to);
  }, [notes, scrollEndSec, scrollStartSec, viewport.width]);

  const timelineGrid = useMemo(() => {
    if (!parsedMidi?.header) return [];
    return buildTimelineGrid(parsedMidi.header, parsedMidi.duration);
  }, [parsedMidi]);

  const visibleGridLines = useMemo(() => {
    if (viewport.width <= 0) return timelineGrid;
    return filterVisibleGridLines(
      timelineGrid,
      scrollStartSec,
      scrollEndSec,
      NOTE_BUFFER_BEHIND_SEC,
      NOTE_BUFFER_AHEAD_SEC,
    );
  }, [scrollEndSec, scrollStartSec, timelineGrid, viewport.width]);

  const duration = parsedMidi?.duration ?? 0;
  const contentWidth = Math.max(duration * PIXELS_PER_SECOND, 240);
  const contentHeight = rows.length * ROW_HEIGHT;

  const syncViewport = useCallback((force = false) => {
    const grid = scrollRef.current;
    if (!grid) return;

    const left = grid.scrollLeft;
    const width = grid.clientWidth;
    const now = performance.now();
    const last = lastViewportPublishRef.current;

    if (
      !force &&
      width === last.width &&
      Math.abs(left - last.left) < VIEWPORT_SCROLL_DELTA_PX &&
      now - last.at < VIEWPORT_SYNC_MS
    ) {
      return;
    }

    lastViewportPublishRef.current = { at: now, left, width };
    if (grid.scrollTop !== lastScrollTopRef.current) {
      lastScrollTopRef.current = grid.scrollTop;
      setScrollTop(grid.scrollTop);
    }
    setViewport({ left, width });
  }, []);

  const disableFollow = useCallback(() => {
    followPlayheadRef.current = false;
    lastManualScrollAtRef.current = 1;
    manualScrollIdleMsRef.current = 0;
  }, []);

  const handleGridScroll = useCallback(() => {
    const grid = scrollRef.current;
    if (!grid) return;

    if (!isAutoFollowScroll(grid.scrollLeft, autoScrollLeftRef.current)) {
      disableFollow();
      syncViewport(true);
      return;
    }

    if (grid.scrollTop !== lastScrollTopRef.current) {
      lastScrollTopRef.current = grid.scrollTop;
      setScrollTop(grid.scrollTop);
    }
  }, [disableFollow, syncViewport]);

  useEffect(() => {
    const grid = scrollRef.current;
    if (!grid) return;

    syncViewport(true);
    lastScrollTopRef.current = grid.scrollTop;
    autoScrollLeftRef.current = grid.scrollLeft;

    const observer = new ResizeObserver(() => syncViewport(true));
    observer.observe(grid);
    return () => observer.disconnect();
  }, [syncViewport, parsedMidi]);

  useEffect(() => {
    const grid = scrollRef.current;
    if (!grid) return;

    const onWheel = (event: WheelEvent) => {
      if (Tone.getTransport().state !== 'started') return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (horizontal || event.shiftKey) disableFollow();
    };

    grid.addEventListener('wheel', onWheel, { passive: true });
    return () => grid.removeEventListener('wheel', onWheel);
  }, [disableFollow, parsedMidi]);

  usePlayheadTracker(scrollRef, playheadRef, {
    autoScrollLeftRef,
    followPlayheadRef,
    lastManualScrollAtRef,
    manualScrollIdleMsRef,
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

    const playheadX = seekTime * PIXELS_PER_SECOND;
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${playheadX}px)`;
    }

    const grid = scrollRef.current;
    if (grid) {
      const scrollLeft = clampFollowScrollLeft(playheadX, grid.clientWidth, grid.scrollWidth);
      grid.scrollLeft = scrollLeft;
      autoScrollLeftRef.current = scrollLeft;
      syncViewport(true);
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
          {rows.map((midi, index) => (
            <div
              key={midi}
              className={cn(
                'flex items-center justify-end border-b pr-1',
                isBlackKey(midi) ? 'bg-[#0b0e14]' : 'bg-[#232a36]',
              )}
              style={{
                height: ROW_HEIGHT,
                borderBottomColor: isOctaveSeparatorBelowRow(rows, index)
                  ? KEYBOARD_LINE_EMPHASIS
                  : KEYBOARD_LINE_ROW,
              }}
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
          className="relative shrink-0 cursor-pointer bg-[#151921]"
          onClick={handleSeek}
          style={{ width: contentWidth, height: contentHeight }}
        >
          <PianoRollLaneChrome rows={rows} />
          <PianoRollVerticalGrid lines={visibleGridLines} />
          <PianoRollNotes maxMidi={maxMidi} notes={visibleNotes} />

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
