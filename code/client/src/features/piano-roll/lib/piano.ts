export const TRACK_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#a855f7',
  '#84cc16',
  '#f97316',
];

export const PIXELS_PER_SEC = 150;
export const NOTE_GAP = 1;
export const KEY_STRIP_HEIGHT = 80;

export const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);

export type NoteLike = {
  midi: number;
};

export type TrackLike = {
  notes: NoteLike[];
};

export function isBlackKey(midi: number) {
  return BLACK_KEY_OFFSETS.has(midi % 12);
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
