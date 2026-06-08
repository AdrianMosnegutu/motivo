'use client';

import { memo } from 'react';

import type { GridLine } from '../lib/grid';
import {
  GRID_LINE_BEAT,
  GRID_LINE_EMPHASIS,
  GRID_LINE_ROW,
  isBlackKey,
  isOctaveSeparatorBelowRow,
  PIXELS_PER_SECOND,
  ROW_HEIGHT,
  trackColor,
} from '../lib/piano';

type LaneChromeProps = {
  rows: number[];
};

export const PianoRollLaneChrome = memo(function PianoRollLaneChrome({ rows }: LaneChromeProps) {
  return (
    <>
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

      {rows.map((midi, index) => (
        <div
          key={`row-line-${midi}`}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{
            top: (index + 1) * ROW_HEIGHT - 1,
            backgroundColor: isOctaveSeparatorBelowRow(rows, index)
              ? GRID_LINE_EMPHASIS
              : GRID_LINE_ROW,
          }}
        />
      ))}
    </>
  );
});

type VerticalGridProps = {
  lines: GridLine[];
};

export const PianoRollVerticalGrid = memo(function PianoRollVerticalGrid({
  lines,
}: VerticalGridProps) {
  return (
    <>
      {lines.map((line) => (
        <div
          key={`${line.kind}-${line.timeSec}`}
          aria-hidden
          className="pointer-events-none absolute bottom-0 top-0 w-px"
          style={{
            left: line.timeSec * PIXELS_PER_SECOND,
            backgroundColor: line.kind === 'bar' ? GRID_LINE_EMPHASIS : GRID_LINE_BEAT,
          }}
        />
      ))}
    </>
  );
});

type NoteRect = {
  duration: number;
  key: string;
  midi: number;
  time: number;
  trackIndex: number;
};

type NotesLayerProps = {
  maxMidi: number;
  notes: NoteRect[];
};

export const PianoRollNotes = memo(function PianoRollNotes({ maxMidi, notes }: NotesLayerProps) {
  return (
    <>
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
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              boxShadow: `0 0 6px ${color}40`,
            }}
          />
        );
      })}
    </>
  );
});
