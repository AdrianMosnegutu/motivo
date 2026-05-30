export type FlatMidiNote = {
  trackIndex: number;
  time: number;
  duration: number;
  midi: number;
  velocity: number;
};

type ParsedTrack = {
  notes: Array<{
    time: number;
    duration: number;
    midi: number;
    velocity: number;
  }>;
};

export function flattenMidiNotes(tracks: ParsedTrack[]): FlatMidiNote[] {
  const notes: FlatMidiNote[] = [];

  for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
    for (const note of tracks[trackIndex].notes) {
      notes.push({
        trackIndex,
        time: note.time,
        duration: note.duration,
        midi: note.midi,
        velocity: note.velocity,
      });
    }
  }

  notes.sort((a, b) => a.time - b.time || a.trackIndex - b.trackIndex);
  return notes;
}

export function findFirstNoteAtOrAfter(notes: FlatMidiNote[], time: number) {
  let low = 0;
  let high = notes.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (notes[mid].time < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}
