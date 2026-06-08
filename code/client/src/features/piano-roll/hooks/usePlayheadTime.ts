'use client';

import { type RefObject, useEffect, useRef } from 'react';
import * as Tone from 'tone';

import {
  clampFollowScrollLeft,
  FOLLOW_RESUME_AFTER_MS,
  PIXELS_PER_SECOND,
  VIEWPORT_SCROLL_DELTA_PX,
  VIEWPORT_SYNC_MS,
} from '../lib/piano';

type UsePlayheadTrackerOptions = {
  /** When false, the user has scrolled manually and the view will not auto-pan. */
  followPlayheadRef: RefObject<boolean>;
  /** Last scrollLeft applied by follow mode; used to distinguish user pans from auto pan. */
  autoScrollLeftRef: RefObject<number>;
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

  useEffect(() => {
    onViewportChangeRef.current = options.onViewportChange;
  }, [options.onViewportChange]);

  useEffect(() => {
    let rafId = 0;
    let lastViewportSync = 0;
    let lastSyncedScrollLeft = -1;
    let lastTick = 0;
    let resumeFromPause = false;

    const scheduleFrame = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(tick);
    };

    const onTransportStart = () => {
      if (!resumeFromPause) {
        options.followPlayheadRef.current = true;
        options.lastManualScrollAtRef.current = 0;
        options.manualScrollIdleMsRef.current = 0;
      }
      resumeFromPause = false;
      scheduleFrame();
    };

    const syncPlayheadTransform = () => {
      const playhead = playheadRef.current;
      if (!playhead) return;
      playhead.style.transform = `translateX(${Tone.getTransport().seconds * PIXELS_PER_SECOND}px)`;
    };

    const onTransportPause = () => {
      resumeFromPause = Tone.getTransport().seconds > 0.01;
      options.manualScrollIdleMsRef.current = 0;
      syncPlayheadTransform();
    };

    const onTransportStop = () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      syncPlayheadTransform();
    };

    Tone.getTransport().on('start', onTransportStart);
    Tone.getTransport().on('pause', onTransportPause);
    Tone.getTransport().on('stop', onTransportStop);

    const tick = (timestamp: number) => {
      rafId = 0;
      const transport = Tone.getTransport();
      const isPlaying = transport.state === 'started';
      if (!isPlaying) return;

      const playhead = playheadRef.current;
      const grid = scrollRef.current;
      const playheadX = transport.seconds * PIXELS_PER_SECOND;

      if (playhead) {
        playhead.style.transform = `translateX(${playheadX}px)`;
      }

      if (grid) {
        const delta = lastTick > 0 ? timestamp - lastTick : 0;
        lastTick = timestamp;

        if (!options.followPlayheadRef.current && options.lastManualScrollAtRef.current > 0) {
          options.manualScrollIdleMsRef.current += delta;
          if (options.manualScrollIdleMsRef.current >= FOLLOW_RESUME_AFTER_MS) {
            options.followPlayheadRef.current = true;
            options.lastManualScrollAtRef.current = 0;
            options.manualScrollIdleMsRef.current = 0;
          }
        }

        const shouldFollow = options.followPlayheadRef.current;

        if (shouldFollow) {
          const targetScroll = clampFollowScrollLeft(playheadX, grid.clientWidth, grid.scrollWidth);
          options.autoScrollLeftRef.current = targetScroll;

          if (Math.abs(grid.scrollLeft - targetScroll) > 0.01) {
            grid.scrollLeft = targetScroll;
          }
        }

        const scrollLeft = grid.scrollLeft;
        const scrollMoved =
          lastSyncedScrollLeft < 0 ||
          Math.abs(scrollLeft - lastSyncedScrollLeft) >= VIEWPORT_SCROLL_DELTA_PX;

        if (
          onViewportChangeRef.current &&
          scrollMoved &&
          timestamp - lastViewportSync >= VIEWPORT_SYNC_MS
        ) {
          lastViewportSync = timestamp;
          lastSyncedScrollLeft = scrollLeft;
          onViewportChangeRef.current();
        }
      }

      scheduleFrame();
    };

    if (Tone.getTransport().state === 'started') {
      scheduleFrame();
    }

    return () => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      Tone.getTransport().off('start', onTransportStart);
      Tone.getTransport().off('pause', onTransportPause);
      Tone.getTransport().off('stop', onTransportStop);
    };
  }, [
    options.autoScrollLeftRef,
    options.followPlayheadRef,
    options.lastManualScrollAtRef,
    options.manualScrollIdleMsRef,
    playheadRef,
    scrollRef,
  ]);
}
