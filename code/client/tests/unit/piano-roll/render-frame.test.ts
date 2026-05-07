import { describe, expect, it, vi } from 'vitest';

import { renderPianoRollFrame } from '@/features/piano-roll/lib/render-frame';

function createContextMock() {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    font: '',
    lineWidth: 0,
    strokeStyle: '',
    textAlign: '',
  } as unknown as CanvasRenderingContext2D;
}

describe('renderPianoRollFrame', () => {
  it('draws notes, keys, labels, and timeline elements', () => {
    const ctx = createContextMock();

    renderPianoRollFrame({
      ctx,
      tracks: [
        {
          notes: [
            { midi: 60, time: 0, duration: 1 },
            { midi: 61, time: 0.5, duration: 1 },
          ],
        },
      ],
      currentTime: 0.5,
      width: 600,
      height: 300,
      minMidi: 58,
      maxMidi: 64,
      theme: 'dark',
    });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('C4', expect.any(Number), expect.any(Number));
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('uses the light palette and skips notes outside the viewport', () => {
    const ctx = createContextMock();

    renderPianoRollFrame({
      ctx,
      tracks: [{ notes: [{ midi: 72, time: 100, duration: 1 }] }],
      currentTime: 0,
      width: 200,
      height: 160,
      minMidi: 70,
      maxMidi: 74,
      theme: 'light',
    });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.arc).not.toHaveBeenCalled();
  });
});
