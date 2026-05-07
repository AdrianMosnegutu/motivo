'use client';

import type { ComponentType } from 'react';
import { Panel } from 'react-resizable-panels';

import PlaybackBar from '@/features/playback/components/PlaybackBar';

interface VisualizerPaneProps {
  PianoRoll: ComponentType;
}

export default function VisualizerPane({ PianoRoll }: VisualizerPaneProps) {
  return (
    <Panel defaultSize={40} minSize={20} className="flex flex-col min-h-0 border-l border-border">
      <div className="h-10 shrink-0 border-b border-border">
        <PlaybackBar />
      </div>
      <div className="flex-1 min-h-0">
        <PianoRoll />
      </div>
    </Panel>
  );
}
