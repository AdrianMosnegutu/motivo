'use client';

import { useEffect, useState } from 'react';
import * as Tone from 'tone';

export function usePlayheadTime() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setTime(Tone.getTransport().seconds);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return time;
}
