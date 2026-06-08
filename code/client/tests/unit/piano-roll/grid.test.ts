import { describe, expect, it } from 'vitest';

import {
  buildTimelineGrid,
  getTicksPerMeasure,
  getTimeSignatureAt,
} from '@/features/piano-roll/lib/grid';

function createHeader(options: {
  bpm?: number;
  ppq?: number;
  timeSignatures?: { ticks: number; timeSignature: [number, number] }[];
  durationSec: number;
}) {
  const ppq = options.ppq ?? 480;
  const bpm = options.bpm ?? 120;
  const timeSignatures = options.timeSignatures ?? [{ ticks: 0, timeSignature: [4, 4] as [number, number] }];

  const tempos = [{ ticks: 0, bpm, time: 0 }];

  return {
    ppq,
    tempos,
    timeSignatures,
    ticksToSeconds(ticks: number) {
      return (ticks / ppq) * (60 / bpm);
    },
    secondsToTicks(seconds: number) {
      return Math.round((seconds / (60 / bpm)) * ppq);
    },
  };
}

describe('piano roll timeline grid', () => {
  it('uses 4 beats per bar for 4/4 at 120 BPM', () => {
    const header = createHeader({ durationSec: 8 });
    const lines = buildTimelineGrid(header as never, 8);
    const barTimes = lines.filter((line) => line.kind === 'bar').map((line) => line.timeSec);

    expect(barTimes.slice(0, 4)).toEqual([0, 2, 4, 6]);
    expect(lines.filter((line) => line.kind === 'beat').map((line) => line.timeSec).slice(0, 3)).toEqual([
      0.5, 1, 1.5,
    ]);
  });

  it('respects the time signature denominator', () => {
    expect(getTicksPerMeasure(480, 4, 4)).toBe(1920);
    expect(getTicksPerMeasure(480, 3, 4)).toBe(1440);
    expect(getTicksPerMeasure(480, 6, 8)).toBe(1440);
  });

  it('picks the active signature for later bars', () => {
    const ppq = 480;
    const signatures = [
      { ticks: 0, timeSignature: [4, 4] as [number, number] },
      { ticks: ppq * 8, timeSignature: [3, 4] as [number, number] },
    ];

    expect(getTimeSignatureAt(signatures as never, 0)).toEqual([4, 4]);
    expect(getTimeSignatureAt(signatures as never, ppq * 8)).toEqual([3, 4]);

    const header = createHeader({
      durationSec: 6,
      ppq,
      timeSignatures: signatures,
    });
    const barTimes = buildTimelineGrid(header as never, 6)
      .filter((line) => line.kind === 'bar')
      .map((line) => line.timeSec);

    expect(barTimes).toEqual([0, 2, 4, 5.5]);
  });
});
