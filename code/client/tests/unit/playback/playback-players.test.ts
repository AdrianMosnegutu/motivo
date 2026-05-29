import { describe, expect, it, vi } from 'vitest';

import { HI_HAT_VELOCITY_GAIN } from '@/features/playback/lib/drum-note-map';
import { wrapSmplrDrumMachine } from '@/features/playback/lib/playback-players';

describe('wrapSmplrDrumMachine', () => {
  it('triggers smplr by drum group name, not raw GM MIDI', () => {
    const start = vi.fn(() => vi.fn());
    const drums = { start, stop: vi.fn() };

    const player = wrapSmplrDrumMachine(drums as never, (midi) => (midi === 42 ? 'hihat' : midi));
    player.playNote({ midi: 42, when: 1, duration: 0.1, velocity: 0.8 });

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        note: 'hihat',
        time: 1,
        duration: 0.1,
        velocity: Math.max(1, Math.round(0.8 * HI_HAT_VELOCITY_GAIN * 127)),
      }),
    );
  });
});
