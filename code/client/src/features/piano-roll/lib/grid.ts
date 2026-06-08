import type { Header } from '@tonejs/midi';

import { findVisibleGridLineRange } from './visible-range';

export type GridLineKind = 'beat' | 'bar';

export type GridLine = {
  kind: GridLineKind;
  timeSec: number;
};

const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];

export function getTimeSignatureAt(
  timeSignatures: Header['timeSignatures'] | undefined,
  tick: number,
): [number, number] {
  if (!timeSignatures || timeSignatures.length === 0) return DEFAULT_TIME_SIGNATURE;

  let active = DEFAULT_TIME_SIGNATURE;
  for (const event of timeSignatures) {
    if (event.ticks > tick) break;
    if (event.timeSignature.length >= 2) {
      active = [event.timeSignature[0], event.timeSignature[1]];
    }
  }

  return active;
}

export function getTicksPerMeasure(ppq: number, numerator: number, denominator: number): number {
  return numerator * ((ppq * 4) / denominator);
}

function buildFallbackGrid(
  durationSec: number,
  numerator: number,
  denominator: number,
  bpm = 120,
): GridLine[] {
  const beatSec = 60 / bpm;
  const measureSec = beatSec * numerator;
  const lines: GridLine[] = [];

  for (let measureStart = 0; measureStart <= durationSec; measureStart += measureSec) {
    lines.push({ kind: 'bar', timeSec: measureStart });
    for (let beat = 1; beat < numerator; beat += 1) {
      const beatTime = measureStart + beat * beatSec;
      if (beatTime > durationSec) continue;
      lines.push({ kind: 'beat', timeSec: beatTime });
    }
  }

  return lines;
}

export function buildTimelineGrid(header: Header, durationSec: number): GridLine[] {
  if (typeof header.secondsToTicks !== 'function' || typeof header.ticksToSeconds !== 'function') {
    const [numerator, denominator] = getTimeSignatureAt(header.timeSignatures, 0);
    const bpm = header.tempos[0]?.bpm ?? 120;
    return buildFallbackGrid(durationSec, numerator, denominator, bpm);
  }

  const ppq = header.ppq || 480;
  const durationTicks = Math.max(0, header.secondsToTicks(durationSec));
  const segments =
    header.timeSignatures && header.timeSignatures.length > 0
      ? [...header.timeSignatures].sort((a, b) => a.ticks - b.ticks)
      : [{ ticks: 0, timeSignature: DEFAULT_TIME_SIGNATURE }];

  const lines: GridLine[] = [];
  const barTicks = new Set<number>();

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const segmentStart = segment.ticks;
    const segmentEnd = index + 1 < segments.length ? segments[index + 1].ticks : durationTicks + 1;
    const [numerator, denominator] =
      segment.timeSignature.length >= 2
        ? [segment.timeSignature[0], segment.timeSignature[1]]
        : DEFAULT_TIME_SIGNATURE;
    const measureTicks = getTicksPerMeasure(ppq, numerator, denominator);
    const beatTicks = measureTicks / numerator;

    let tick = segmentStart;
    while (tick < segmentEnd && tick <= durationTicks) {
      if (!barTicks.has(tick)) {
        barTicks.add(tick);
        lines.push({ kind: 'bar', timeSec: header.ticksToSeconds(tick) });
      }

      for (let beat = 1; beat < numerator; beat += 1) {
        const beatTick = tick + beat * beatTicks;
        if (beatTick >= segmentEnd || beatTick > durationTicks) continue;
        lines.push({ kind: 'beat', timeSec: header.ticksToSeconds(beatTick) });
      }

      tick += measureTicks;
    }
  }

  return lines.sort((a, b) => a.timeSec - b.timeSec);
}

export function filterVisibleGridLines(
  lines: GridLine[],
  scrollStartSec: number,
  scrollEndSec: number,
  bufferBehindSec: number,
  bufferAheadSec: number,
): GridLine[] {
  const start = scrollStartSec - bufferBehindSec;
  const end = scrollEndSec + bufferAheadSec;
  const { start: from, end: to } = findVisibleGridLineRange(lines, start, end);
  return lines.slice(from, to);
}
