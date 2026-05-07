'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

import { useMidi } from '@/features/midi/MidiContext';

import { useCanvasSize } from '../hooks/useCanvasSize';
import { useNoteRange } from '../hooks/useNoteRange';
import { usePlayheadTime } from '../hooks/usePlayheadTime';
import { renderPianoRollFrame } from '../lib/render-frame';

export default function PianoRoll() {
  const { resolvedTheme } = useTheme();
  const { parsedMidi } = useMidi();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(containerRef);
  const currentTime = usePlayheadTime();
  const { minMidi, maxMidi } = useNoteRange(parsedMidi?.tracks ?? null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsedMidi || width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderPianoRollFrame({
      ctx,
      tracks: parsedMidi.tracks,
      currentTime,
      width,
      height,
      minMidi,
      maxMidi,
      theme: resolvedTheme,
    });
  }, [currentTime, height, maxMidi, minMidi, parsedMidi, resolvedTheme, width]);

  return (
    <div ref={containerRef} className="w-full h-full bg-panel overflow-hidden">
      {!parsedMidi ? (
        <div className="flex items-center justify-center h-full text-zinc-400 font-mono text-xs text-center px-4">
          Compile your code to see the visualizer
        </div>
      ) : (
        width > 0 &&
        height > 0 && (
          <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
        )
      )}
    </div>
  );
}
