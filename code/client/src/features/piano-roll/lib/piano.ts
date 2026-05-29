export const ROW_HEIGHT = 24;
export const PIXELS_PER_SECOND = 90;

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
