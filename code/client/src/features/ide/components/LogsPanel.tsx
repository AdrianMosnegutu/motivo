'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Panel, type PanelImperativeHandle } from 'react-resizable-panels';

import type { LogEntry } from '@/features/compile/types';

import LogsPane from './LogsPane';

interface LogsPanelProps {
  log: LogEntry | null;
  panelRef: RefObject<PanelImperativeHandle | null>;
  setLog: Dispatch<SetStateAction<LogEntry | null>>;
  onJump: (line: number, column: number) => void;
}

export default function LogsPanel({ log, panelRef, setLog, onJump }: LogsPanelProps) {
  return (
    <Panel
      panelRef={panelRef}
      defaultSize="30%"
      minSize="0%"
      collapsible
      className="flex flex-col min-h-0"
    >
      <LogsPane log={log} onClear={() => setLog(null)} onJump={onJump} />
    </Panel>
  );
}
