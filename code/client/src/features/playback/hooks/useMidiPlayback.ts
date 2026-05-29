'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

import type { useMidi } from '@/features/midi/MidiContext';

import { stopPlayers, stopScheduledVoices as haltScheduledVoices } from '../lib/audio-nodes';
import {
  findFirstNoteAtOrAfter,
  flattenMidiNotes,
  type FlatMidiNote,
} from '../lib/flatten-midi-notes';
import {
  createSharedSampleLoader,
  loadPlaybackInstrument,
  resolveInstrument,
} from '../lib/instruments';
import type { LoadState, PlaybackPlayer, PlayState, ScheduledVoice } from '../types';

type ParsedMidi = NonNullable<ReturnType<typeof useMidi>['parsedMidi']>;

const LOOKAHEAD_SECONDS = 2;
const SCHEDULE_INTERVAL_MS = 125;
const MAX_NOTES_PER_TICK = 64;
const DISPLAY_REFRESH_MS = 250;

export function useMidiPlayback(parsedMidi: ParsedMidi | null) {
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [midiLoadState, setMidiLoadState] = useState<LoadState>('idle');
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [loop, setLoop] = useState(false);
  const loadState = parsedMidi ? midiLoadState : 'idle';

  const playersRef = useRef<PlaybackPlayer[]>([]);
  const scheduledVoicesRef = useRef<ScheduledVoice[]>([]);
  const notesRef = useRef<FlatMidiNote[]>([]);
  const nextNoteIndexRef = useRef(0);
  const playbackAnchorRef = useRef({ audioTime: 0, transportTime: 0 });
  const pauseOffsetRef = useRef(0);
  const scheduleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const loopRef = useRef(loop);
  const playStateRef = useRef(playState);
  const lastDisplayRefreshRef = useRef(0);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

  const toggleLoop = useCallback(() => setLoop((value) => !value), []);

  const clearScheduledVoices = useCallback(() => {
    haltScheduledVoices(scheduledVoicesRef.current);
    scheduledVoicesRef.current = [];
  }, []);

  const clearScheduleTimer = useCallback(() => {
    if (scheduleTimerRef.current) {
      clearInterval(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    clearScheduleTimer();
    clearScheduledVoices();
    stopPlayers(playersRef.current);
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    nextNoteIndexRef.current = 0;
    setPlayState('stopped');
    setDisplaySeconds(0);
  }, [clearScheduleTimer, clearScheduledVoices]);

  const scheduleUpcomingNotes = useCallback(() => {
    if (!parsedMidi || playStateRef.current !== 'playing') return;

    const audioContext = Tone.getContext().rawContext as AudioContext;
    const transportSeconds = Tone.getTransport().seconds;
    const horizon = transportSeconds + LOOKAHEAD_SECONDS;
    const anchor = playbackAnchorRef.current;
    const notes = notesRef.current;
    let index = nextNoteIndexRef.current;
    let scheduled = 0;

    while (index < notes.length && notes[index].time < horizon && scheduled < MAX_NOTES_PER_TICK) {
      const note = notes[index];

      if (note.time + note.duration < anchor.transportTime) {
        index += 1;
        continue;
      }

      const player = playersRef.current[note.trackIndex];
      if (!player) {
        index += 1;
        continue;
      }

      const scheduleAt = anchor.audioTime + (note.time - anchor.transportTime);
      if (scheduleAt < audioContext.currentTime - 0.02) {
        index += 1;
        continue;
      }

      const voice = player.playNote({
        midi: note.midi,
        when: scheduleAt,
        duration: note.duration,
        velocity: note.velocity,
      });
      scheduledVoicesRef.current.push(voice);
      index += 1;
      scheduled += 1;
    }

    nextNoteIndexRef.current = index;
  }, [parsedMidi]);

  const beginPlayback = useCallback(
    (transportOffset: number) => {
      const audioContext = Tone.getContext().rawContext as AudioContext;
      playbackAnchorRef.current = {
        audioTime: audioContext.currentTime + 0.05,
        transportTime: transportOffset,
      };
      nextNoteIndexRef.current = findFirstNoteAtOrAfter(notesRef.current, transportOffset);
      scheduleUpcomingNotes();
    },
    [scheduleUpcomingNotes],
  );

  const startScheduler = useCallback(() => {
    clearScheduleTimer();
    scheduleTimerRef.current = setInterval(scheduleUpcomingNotes, SCHEDULE_INTERVAL_MS);
  }, [clearScheduleTimer, scheduleUpcomingNotes]);

  const handlePlay = useCallback(async () => {
    if (!parsedMidi || loadState !== 'ready') return;

    await Tone.start();
    const offset = pauseOffsetRef.current;

    if (playState === 'paused') {
      playStateRef.current = 'playing';
      Tone.getTransport().start();
      beginPlayback(offset);
      startScheduler();
      setPlayState('playing');
      return;
    }

    pauseOffsetRef.current = 0;
    playStateRef.current = 'playing';
    Tone.getTransport().seconds = 0;
    Tone.getTransport().start();
    beginPlayback(0);
    startScheduler();
    setPlayState('playing');
  }, [beginPlayback, loadState, parsedMidi, playState, startScheduler]);

  const restartFromStart = useCallback(() => {
    clearScheduledVoices();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    beginPlayback(0);
  }, [beginPlayback, clearScheduledVoices]);

  const handlePause = useCallback(() => {
    clearScheduleTimer();
    const offset = Tone.getTransport().seconds;
    clearScheduledVoices();
    Tone.getTransport().pause();
    pauseOffsetRef.current = offset;
    setDisplaySeconds(offset);
    setPlayState('paused');
  }, [clearScheduleTimer, clearScheduledVoices]);

  const handleRewind = useCallback(() => {
    const isPlaying = playState === 'playing';
    clearScheduleTimer();
    clearScheduledVoices();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    nextNoteIndexRef.current = 0;
    setDisplaySeconds(0);

    if (isPlaying) {
      playStateRef.current = 'playing';
      beginPlayback(0);
      startScheduler();
    } else {
      playStateRef.current = 'stopped';
      setPlayState('stopped');
    }
  }, [beginPlayback, clearScheduleTimer, playState, startScheduler, clearScheduledVoices]);

  const handleSeek = useCallback(
    (seekTime: number) => {
      if (!parsedMidi) return;

      clearScheduleTimer();
      clearScheduledVoices();
      Tone.getTransport().seconds = seekTime;
      pauseOffsetRef.current = seekTime;
      setDisplaySeconds(seekTime);
      nextNoteIndexRef.current = findFirstNoteAtOrAfter(notesRef.current, seekTime);

      if (playState === 'playing') {
        playStateRef.current = 'playing';
        beginPlayback(seekTime);
        startScheduler();
      }
    },
    [beginPlayback, clearScheduleTimer, parsedMidi, playState, startScheduler, clearScheduledVoices],
  );

  useEffect(() => {
    if (!parsedMidi) {
      playersRef.current = [];
      notesRef.current = [];
      return;
    }

    notesRef.current = flattenMidiNotes(parsedMidi.tracks);

    let cancelled = false;
    clearScheduleTimer();
    clearScheduledVoices();
    stopPlayers(playersRef.current);
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    nextNoteIndexRef.current = 0;

    (async () => {
      try {
        await Promise.resolve();
        if (cancelled) return;

        setPlayState('stopped');
        setDisplaySeconds(0);
        setMidiLoadState('loading');
        const audioContext = Tone.getContext().rawContext as AudioContext;
        const trackNames = parsedMidi.tracks.map((track) =>
          resolveInstrument(
            track.instrument.number,
            track.channel,
            track.instrument.percussion,
          ),
        );
        const uniqueNames = [...new Set(trackNames)];
        const loader = createSharedSampleLoader(audioContext);
        const loaded = await Promise.all(
          uniqueNames.map((name) => loadPlaybackInstrument(audioContext, name, loader)),
        );
        if (cancelled) return;

        const nameToPlayer = new Map(uniqueNames.map((name, index) => [name, loaded[index]]));
        playersRef.current = trackNames.map((name) => nameToPlayer.get(name)!);
        setMidiLoadState('ready');
      } catch {
        if (!cancelled) setMidiLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearScheduleTimer, parsedMidi, clearScheduledVoices]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const current = Tone.getTransport().seconds;
      const total = parsedMidi?.duration ?? 0;

      if (
        playStateRef.current === 'playing' &&
        timestamp - lastDisplayRefreshRef.current >= DISPLAY_REFRESH_MS
      ) {
        lastDisplayRefreshRef.current = timestamp;
        setDisplaySeconds(current);
      }

      if (playStateRef.current === 'playing' && parsedMidi && current >= parsedMidi.duration) {
        if (loopRef.current) {
          restartFromStart();
        } else {
          stopAll();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [parsedMidi, restartFromStart, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    canPlay: loadState === 'ready',
    currentSeconds: displaySeconds,
    handlePause,
    handlePlay,
    handleRewind,
    handleSeek,
    loadState,
    loop,
    playState,
    stopAll,
    toggleLoop,
  };
};
