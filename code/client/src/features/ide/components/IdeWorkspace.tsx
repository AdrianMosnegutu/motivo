'use client';

import { useRef } from 'react';
import { Group, Panel, usePanelRef } from 'react-resizable-panels';
import dynamic from 'next/dynamic';

import type { MotivoEditorHandle } from '@/features/editor/components/MotivoEditor';
import FileExplorer from '@/features/files/components/FileExplorer';
import { useFileWorkspace } from '@/features/files/hooks/useFileWorkspace';
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
  const fileWorkspace = useFileWorkspace();
  const { compiling, log, setLog, handleCompile, handleJumpToError } = useIdeCompile(
    editorRef,
    fileWorkspace.activeDocument.source,
  );

  useLogsPanelShortcut(logsPanelRef);

  const handleDownloadActiveFile = () => {
    if (fileWorkspace.activeDocument.kind !== 'user') return;
    void fileWorkspace.downloadUserFile(fileWorkspace.activeDocument.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <Group orientation="horizontal" className="flex-1 min-h-0 min-w-0">
        <Panel defaultSize="22%" minSize="18%" maxSize="32%" className="min-w-0">
          <FileExplorer
            activeDocument={fileWorkspace.activeDocument}
            authLoading={fileWorkspace.authLoading}
            authenticated={fileWorkspace.authenticated}
            examples={fileWorkspace.examples}
            filesLoading={fileWorkspace.filesLoading}
            operationError={fileWorkspace.operationError}
            userFiles={fileWorkspace.userFiles}
            onCreateFile={fileWorkspace.createUserFile}
            onDeleteFile={fileWorkspace.deleteUserFile}
            onDownloadFile={fileWorkspace.downloadUserFile}
            onOpenExample={fileWorkspace.openExample}
            onOpenScratch={fileWorkspace.openScratch}
            onOpenUserFile={fileWorkspace.openUserFile}
            onRefresh={fileWorkspace.refresh}
            onRenameFile={fileWorkspace.renameUserFile}
          />
        </Panel>

        <ResizeHandle direction="horizontal" />

        <Panel defaultSize="46%" minSize="35%" className="min-w-0">
          <Group orientation="vertical" className="min-h-0 min-w-0">
            <EditorPane
              activeDocument={fileWorkspace.activeDocument}
              autosaveStatus={fileWorkspace.autosaveStatus}
              MotivoEditor={MotivoEditor}
              editorRef={editorRef}
              compiling={compiling}
              onDownloadActiveFile={handleDownloadActiveFile}
              onCompile={handleCompile}
              onEditorChange={fileWorkspace.handleSourceChange}
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
