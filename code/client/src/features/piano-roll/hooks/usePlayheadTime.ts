'use client';

import { type RefObject, useEffect, useRef } from 'react';
import * as Tone from 'tone';

import { FOLLOW_RESUME_AFTER_MS, PIXELS_PER_SECOND } from '../lib/piano';

const VIEWPORT_SYNC_MS = 100;

type UsePlayheadTrackerOptions = {
  /** When false, the user has scrolled manually and the view will not auto-pan. */
  followPlayheadRef: RefObject<boolean>;
  /** Set true before programmatic scrollLeft updates so onScroll can tell user vs auto pan. */
  programmaticScrollRef: RefObject<boolean>;
  /** Non-zero after the user scrolls away from follow mode; cleared when follow resumes. */
  lastManualScrollAtRef: RefObject<number>;
  /** Accumulated playback time (ms) since the last manual scroll while unfollowed. */
  manualScrollIdleMsRef: RefObject<number>;
  /** Called when the scroll container moves (throttled) so viewport culling stays in sync. */
  onViewportChange?: () => void;
};

/** Moves the playhead and optionally keeps it in view without React state on every frame. */
export function usePlayheadTracker(
  scrollRef: RefObject<HTMLElement | null>,
  playheadRef: RefObject<HTMLElement | null>,
  options: UsePlayheadTrackerOptions,
) {
  const onViewportChangeRef = useRef(options.onViewportChange);
  onViewportChangeRef.current = options.onViewportChange;

  useEffect(() => {
    let rafId = 0;
    let lastViewportSync = 0;
    let lastTick = 0;
    let resumeFromPause = false;

    const onTransportStart = () => {
      if (!resumeFromPause) {
        options.followPlayheadRef.current = true;
        options.lastManualScrollAtRef.current = 0;
        options.manualScrollIdleMsRef.current = 0;
      }
      resumeFromPause = false;
    };

    const onTransportPause = () => {
      resumeFromPause = Tone.getTransport().seconds > 0.01;
      options.manualScrollIdleMsRef.current = 0;
    };

    Tone.getTransport().on('start', onTransportStart);
    Tone.getTransport().on('pause', onTransportPause);

    const tick = (timestamp: number) => {
      const playhead = playheadRef.current;
      const grid = scrollRef.current;
      const playheadX = Tone.getTransport().seconds * PIXELS_PER_SECOND;
      const isPlaying = Tone.getTransport().state === 'started';

      if (playhead) {
        playhead.style.transform = `translateX(${playheadX}px)`;
      }

      if (grid) {
        const delta = lastTick > 0 ? timestamp - lastTick : 0;
        lastTick = timestamp;

        if (isPlaying && !options.followPlayheadRef.current && options.lastManualScrollAtRef.current > 0) {
          options.manualScrollIdleMsRef.current += delta;
          if (options.manualScrollIdleMsRef.current >= FOLLOW_RESUME_AFTER_MS) {
            options.followPlayheadRef.current = true;
            options.lastManualScrollAtRef.current = 0;
            options.manualScrollIdleMsRef.current = 0;
          }
        } else if (!isPlaying) {
          options.manualScrollIdleMsRef.current = 0;
        }

        const shouldFollow = isPlaying && options.followPlayheadRef.current;

        if (shouldFollow) {
          const viewLeft = grid.scrollLeft;
          const viewRight = viewLeft + grid.clientWidth;

          if (playheadX < viewLeft || playheadX > viewRight) {
            options.programmaticScrollRef.current = true;
            grid.scrollLeft = Math.max(0, playheadX - grid.clientWidth / 2);
          }
        }

        if (
          onViewportChangeRef.current &&
          timestamp - lastViewportSync >= VIEWPORT_SYNC_MS
        ) {
          lastViewportSync = timestamp;
          onViewportChangeRef.current();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      Tone.getTransport().off('start', onTransportStart);
      Tone.getTransport().off('pause', onTransportPause);
    };
  }, [
    options.followPlayheadRef,
    options.lastManualScrollAtRef,
    options.manualScrollIdleMsRef,
    options.programmaticScrollRef,
    playheadRef,
    scrollRef,
  ]);
}
