'use client';

import type { ComponentType, RefObject } from 'react';
import { Panel, type PanelImperativeHandle, type PanelProps } from 'react-resizable-panels';

import PlaybackBar from '@/features/playback/components/PlaybackBar';

interface VisualizerPaneProps {
  panelRef?: RefObject<PanelImperativeHandle | null>;
  onResize?: PanelProps['onResize'];
  PianoRoll: ComponentType;
}

export default function VisualizerPane({ panelRef, onResize, PianoRoll }: VisualizerPaneProps) {
  return (
    <Panel
      panelRef={panelRef}
      onResize={onResize}
      defaultSize="450px"
      minSize="320px"
      maxSize="50%"
      collapsible
      collapsedSize="0%"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-[#2a303c] bg-[#151921]"
    >
      <PlaybackBar />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <PianoRoll />
      </div>
    </Panel>
  );
}
