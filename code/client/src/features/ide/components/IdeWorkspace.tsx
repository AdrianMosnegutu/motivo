'use client';

import { useRef } from 'react';
import { Group, Panel, usePanelRef } from 'react-resizable-panels';
import dynamic from 'next/dynamic';

import type { MotivoEditorHandle } from '@/features/editor/components/MotivoEditor';
import ResizeHandle from '@/shared/components/ResizeHandle';

import { useIdeCompile } from '../hooks/useIdeCompile';
import { useLogsPanelShortcut } from '../hooks/useLogsPanelShortcut';

import EditorPane from './EditorPane';
import LoadingPane from './LoadingPane';
import LogsPanel from './LogsPanel';
import VisualizerPane from './VisualizerPane';

const MotivoEditor = dynamic(() => import('@/features/editor/components/MotivoEditor'), {
  ssr: false,
  loading: () => <LoadingPane label="Loading editor..." />,
});

const PianoRoll = dynamic(() => import('@/features/piano-roll/components/PianoRoll'), {
  ssr: false,
  loading: () => <LoadingPane label="Loading piano roll..." className="text-xs bg-[#0d0d0f]" />,
});

export default function IdeWorkspace() {
  const editorRef = useRef<MotivoEditorHandle>(null);
  const logsPanelRef = usePanelRef();
  const { compiling, log, setLog, handleCompile, handleEditorChange, handleJumpToError } =
    useIdeCompile(editorRef);

  useLogsPanelShortcut(logsPanelRef);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Group orientation="horizontal" className="flex-1">
        <Panel defaultSize={60} minSize={30}>
          <Group orientation="vertical">
            <EditorPane
              MotivoEditor={MotivoEditor}
              editorRef={editorRef}
              compiling={compiling}
              onCompile={handleCompile}
              onEditorChange={handleEditorChange}
            />

            <ResizeHandle direction="vertical" />

            <LogsPanel
              panelRef={logsPanelRef}
              log={log}
              setLog={setLog}
              onJump={handleJumpToError}
            />
          </Group>
        </Panel>

        <ResizeHandle direction="horizontal" />

        <VisualizerPane PianoRoll={PianoRoll} />
      </Group>
    </div>
  );
}
