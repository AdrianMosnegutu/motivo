'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Panel, type PanelImperativeHandle, type PanelProps } from 'react-resizable-panels';

import type { LogEntry } from '@/features/compile/types';

import LogsPane from './LogsPane';

interface LogsPanelProps {
  log: LogEntry | null;
  panelRef: RefObject<PanelImperativeHandle | null>;
  onResize?: PanelProps['onResize'];
  setLog: Dispatch<SetStateAction<LogEntry | null>>;
  onJump: (line: number, column: number) => void;
}

export default function LogsPanel({ log, panelRef, onResize, setLog, onJump }: LogsPanelProps) {
  return (
    <Panel
      panelRef={panelRef}
      onResize={onResize}
      defaultSize="30%"
      minSize="0%"
      maxSize="50%"
      collapsible
      collapsedSize="0%"
      className="flex min-h-0 flex-col"
    >
      <LogsPane
        log={log}
        onClear={() => setLog(null)}
        onJump={onJump}
        onToggleCollapse={() => {
          const panel = panelRef.current;
          if (!panel) return;
          if (panel.isCollapsed()) {
            panel.expand();
          } else {
            panel.collapse();
          }
        }}
      />
    </Panel>
  );
}
