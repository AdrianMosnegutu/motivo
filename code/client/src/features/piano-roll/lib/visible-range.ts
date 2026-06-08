export function findVisibleNoteRange(
  notes: ReadonlyArray<{ time: number; duration: number }>,
  windowStart: number,
  windowEnd: number,
): { start: number; end: number } {
  if (notes.length === 0) return { start: 0, end: 0 };

  let low = 0;
  let high = notes.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (notes[mid].time + notes[mid].duration < windowStart) low = mid + 1;
    else high = mid;
  }
  const start = low;

  low = start;
  high = notes.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (notes[mid].time <= windowEnd) low = mid + 1;
    else high = mid;
  }

  return { start, end: low };
}

export function findVisibleGridLineRange(
  lines: ReadonlyArray<{ timeSec: number }>,
  windowStart: number,
  windowEnd: number,
): { start: number; end: number } {
  if (lines.length === 0) return { start: 0, end: 0 };

  let low = 0;
  let high = lines.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (lines[mid].timeSec < windowStart) low = mid + 1;
    else high = mid;
  }
  const start = low;

  low = start;
  high = lines.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (lines[mid].timeSec <= windowEnd) low = mid + 1;
    else high = mid;
  }

  return { start, end: low };
}
