'use client';

import type { ComponentType } from 'react';
import { Panel } from 'react-resizable-panels';

import PlaybackBar from '@/features/playback/components/PlaybackBar';

interface VisualizerPaneProps {
  PianoRoll: ComponentType;
}

export default function VisualizerPane({ PianoRoll }: VisualizerPaneProps) {
  return (
    <Panel
      defaultSize="32%"
      minSize="20%"
      maxSize="45%"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-border"
    >
      <div className="h-10 shrink-0 border-b border-border">
        <PlaybackBar />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <PianoRoll />
      </div>
    </Panel>
  );
}
