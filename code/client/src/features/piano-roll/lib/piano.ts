export const ROW_HEIGHT = 24;
export const PIXELS_PER_SECOND = 90;

/** Measure bars and octave boundaries — slightly stronger than row lines. */
export const GRID_LINE_EMPHASIS = 'rgba(54, 62, 76, 0.72)';
export const GRID_LINE_BEAT = 'rgba(42, 48, 60, 0.33)';
export const GRID_LINE_ROW = 'rgba(42, 48, 60, 0.5)';
export const KEYBOARD_LINE_ROW = '#11151c';
export const KEYBOARD_LINE_EMPHASIS = 'rgba(54, 62, 76, 0.85)';

/** Extra timeline rendered behind the scroll position (seconds). */
export const NOTE_BUFFER_BEHIND_SEC = 1.5;
/** Extra timeline rendered ahead of the scroll position and playhead (seconds). */
export const NOTE_BUFFER_AHEAD_SEC = 8;
/** After manual scroll, resume following the playhead once playback is idle this long (ms). */
export const FOLLOW_RESUME_AFTER_MS = 5000;
/** Min interval between React viewport updates during playback (ms). */
export const VIEWPORT_SYNC_MS = 300;
/** Min horizontal scroll delta before publishing a new viewport (px). */
export const VIEWPORT_SCROLL_DELTA_PX = 72;
/** Playhead horizontal anchor in the viewport while follow mode is active (0–1). */
export const PLAYHEAD_FOLLOW_ANCHOR_RATIO = 0.35;
/** Max |scrollLeft − auto target| to treat a scroll event as follow-driven (px). */
export const AUTO_SCROLL_TOLERANCE = 2;

export function clampFollowScrollLeft(
  playheadX: number,
  clientWidth: number,
  scrollWidth: number,
  anchorRatio = PLAYHEAD_FOLLOW_ANCHOR_RATIO,
): number {
  const anchorX = clientWidth * anchorRatio;
  const target = Math.max(0, playheadX - anchorX);
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  return Math.min(target, maxScroll);
}

export function isAutoFollowScroll(
  scrollLeft: number,
  autoScrollLeft: number,
  tolerance = AUTO_SCROLL_TOLERANCE,
): boolean {
  return Math.abs(scrollLeft - autoScrollLeft) <= tolerance;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);
const OCTAVE_ANCHOR_OFFSETS = new Set([0, 4, 7]);

export const TRACK_COLORS = [
  '#38bdf8',
  '#a855f7',
  '#f59e0b',
  '#22c55e',
  '#f43f5e',
  '#14b8a6',
  '#eab308',
  '#ec4899',
];

export function trackColor(index: number) {
  return TRACK_COLORS[((index % TRACK_COLORS.length) + TRACK_COLORS.length) % TRACK_COLORS.length];
}

export type NoteLike = {
  midi: number;
};

export type TrackLike = {
  notes: NoteLike[];
};

function pitchClass(midi: number) {
  return ((midi % 12) + 12) % 12;
}

export function isBlackKey(midi: number) {
  return BLACK_KEY_OFFSETS.has(pitchClass(midi));
}

export function isOctaveAnchor(midi: number) {
  return OCTAVE_ANCHOR_OFFSETS.has(pitchClass(midi));
}

/** True when a horizontal line below `rowIndex` separates two MIDI octaves (rows are high → low). */
export function isOctaveSeparatorBelowRow(rows: number[], rowIndex: number): boolean {
  const lowerMidi = rows[rowIndex + 1];
  if (lowerMidi === undefined) return false;
  return Math.floor(rows[rowIndex] / 12) !== Math.floor(lowerMidi / 12);
}

export function midiToLabel(midi: number) {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pitchClass(midi)]}${octave}`;
}

export function calculateNoteRange(tracks: TrackLike[] | null) {
  if (!tracks || tracks.length === 0) return { minMidi: 48, maxMidi: 84 };

  let min = 127;
  let max = 0;
  for (const track of tracks) {
    for (const note of track.notes) {
      if (note.midi < min) min = note.midi;
      if (note.midi > max) max = note.midi;
    }
  }

  if (min === 127 && max === 0) return { minMidi: 48, maxMidi: 84 };

  return { minMidi: Math.max(0, min - 2), maxMidi: Math.min(127, max + 2) };
}
