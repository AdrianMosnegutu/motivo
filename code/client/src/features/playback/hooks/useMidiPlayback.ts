'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

import type { useMidi } from '@/features/midi/MidiContext';

import { stopAudioNodes, stopPlayers } from '../lib/audio-nodes';
import { resolveInstrument } from '../lib/instruments';
import type { LoadState, PlayState, SfPlayer } from '../types';

type ParsedMidi = NonNullable<ReturnType<typeof useMidi>['parsedMidi']>;

export function useMidiPlayback(parsedMidi: ParsedMidi | null) {
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [midiLoadState, setMidiLoadState] = useState<LoadState>('idle');
  const [position, setPosition] = useState('0.0s / 0.0s');
  const loadState = parsedMidi ? midiLoadState : 'idle';

  const playersRef = useRef<SfPlayer[]>([]);
  const scheduledNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const pauseOffsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const stopScheduledAudio = useCallback(() => {
    stopAudioNodes(scheduledNodesRef.current);
    scheduledNodesRef.current = [];
    stopPlayers(playersRef.current);
  }, []);

  const stopAll = useCallback(() => {
    stopScheduledAudio();
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    setPlayState('stopped');
    setPosition('0.0s');
  }, [stopScheduledAudio]);

  const scheduleNotes = useCallback(
    (audioContext: AudioContext, fromOffset: number) => {
      if (!parsedMidi) return;
      scheduledNodesRef.current = [];
      const audioStart = audioContext.currentTime + 0.05;

      for (let trackIndex = 0; trackIndex < parsedMidi.tracks.length; trackIndex++) {
        const player = playersRef.current[trackIndex];
        if (!player) continue;

        for (const note of parsedMidi.tracks[trackIndex].notes) {
          if (note.time + note.duration < fromOffset) continue;

          const scheduleAt = audioStart + (note.time - fromOffset);
          if (scheduleAt < audioContext.currentTime) continue;

          const noteName = Tone.Frequency(note.midi, 'midi').toNote();
          const node = player.play(noteName, scheduleAt, {
            duration: note.duration,
            gain: note.velocity,
          });
          scheduledNodesRef.current.push(node);
        }
      }
    },
    [parsedMidi],
  );

  const handlePlay = useCallback(async () => {
    if (!parsedMidi || loadState !== 'ready') return;

    await Tone.start();
    const audioContext = Tone.getContext().rawContext as AudioContext;
    const offset = pauseOffsetRef.current;

    if (playState === 'paused') {
      scheduleNotes(audioContext, offset);
      Tone.getTransport().start();
      setPlayState('playing');
      return;
    }

    pauseOffsetRef.current = 0;
    Tone.getTransport().seconds = 0;
    scheduleNotes(audioContext, 0);
    Tone.getTransport().start();
    setPlayState('playing');
  }, [loadState, parsedMidi, playState, scheduleNotes]);

  const handlePause = useCallback(() => {
    const offset = Tone.getTransport().seconds;
    stopScheduledAudio();
    Tone.getTransport().pause();
    pauseOffsetRef.current = offset;
    setPlayState('paused');
  }, [stopScheduledAudio]);

  const handleRewind = useCallback(() => {
    const isPlaying = playState === 'playing';
    stopScheduledAudio();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;
    setPosition('0.0s');

    if (isPlaying) {
      void handlePlay();
    } else {
      setPlayState('stopped');
    }
  }, [handlePlay, playState, stopScheduledAudio]);

  const handleSeek = useCallback(
    (seekTime: number) => {
      if (!parsedMidi) return;
      const isPlaying = playState === 'playing';

      stopAudioNodes(scheduledNodesRef.current);
      scheduledNodesRef.current = [];

      Tone.getTransport().seconds = seekTime;
      pauseOffsetRef.current = seekTime;

      if (isPlaying) {
        const audioContext = Tone.getContext().rawContext as AudioContext;
        scheduleNotes(audioContext, seekTime);
      }
    },
    [parsedMidi, playState, scheduleNotes],
  );

  useEffect(() => {
    if (!parsedMidi) {
      playersRef.current = [];
      return;
    }

    let cancelled = false;
    stopScheduledAudio();
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    pauseOffsetRef.current = 0;

    (async () => {
      try {
        await Promise.resolve();
        if (cancelled) return;

        setPlayState('stopped');
        setPosition('0.0s');
        setMidiLoadState('loading');
        const { default: Soundfont } = await import('soundfont-player');
        const audioContext = Tone.getContext().rawContext as AudioContext;
        const trackNames = parsedMidi.tracks.map((track) =>
          resolveInstrument(track.instrument.number, track.channel),
        );
        const uniqueNames = [...new Set(trackNames)];
        const loaded = await Promise.all(
          uniqueNames.map((name) =>
            Soundfont.instrument(audioContext, name as Parameters<typeof Soundfont.instrument>[1]),
          ),
        );
        if (cancelled) return;

        const nameToPlayer = new Map(
          uniqueNames.map((name, index) => [name, loaded[index] as unknown as SfPlayer]),
        );
        playersRef.current = trackNames.map((name) => nameToPlayer.get(name)!);
        setMidiLoadState('ready');
      } catch {
        if (!cancelled) setMidiLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [parsedMidi, stopScheduledAudio]);

  useEffect(() => {
    const tick = () => {
      const current = Tone.getTransport().seconds;
      const total = parsedMidi?.duration ?? 0;
      setPosition(`${current.toFixed(1)}s / ${total.toFixed(1)}s`);

      if (playState === 'playing' && parsedMidi && current >= parsedMidi.duration) {
        stopAll();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [parsedMidi, playState, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    canPlay: loadState === 'ready',
    currentSeconds: Tone.getTransport().seconds,
    handlePause,
    handlePlay,
    handleRewind,
    handleSeek,
    loadState,
    playState,
    position,
    stopAll,
  };
}
