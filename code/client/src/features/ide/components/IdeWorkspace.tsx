'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Group,
  Panel,
  type PanelImperativeHandle,
  type PanelSize,
  usePanelRef,
} from 'react-resizable-panels';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { MotivoEditorHandle } from '@/features/editor/components/MotivoEditor';
import FileExplorer from '@/features/files/components/FileExplorer';
import { useFileWorkspace } from '@/features/files/hooks/useFileWorkspace';
import ResizeHandle from '@/shared/components/ResizeHandle';

import { useIdeActions } from '../context/IdeActionsContext';
import { useIdeCompile } from '../hooks/useIdeCompile';
import { useLogsPanelShortcut } from '../hooks/useLogsPanelShortcut';
import { useSaveShortcut } from '../hooks/useSaveShortcut';

import EditorPane from './EditorPane';
import LoadingPane from './LoadingPane';
import LogsPanel from './LogsPanel';
import VisualizerPane from './VisualizerPane';

type CloseRequest = { key: string; name: string; kind: 'scratch' | 'user' };

const MotivoEditor = dynamic(() => import('@/features/editor/components/MotivoEditor'), {
  ssr: false,
  loading: () => <LoadingPane label="Loading editor..." />,
});

const PianoRoll = dynamic(() => import('@/features/piano-roll/components/PianoRoll'), {
  ssr: false,
  loading: () => <LoadingPane label="Loading piano roll..." className="bg-[#151921] text-xs" />,
});

export default function IdeWorkspace() {
  const editorRef = useRef<MotivoEditorHandle>(null);
  const explorerPanelRef = usePanelRef();
  const logsPanelRef = usePanelRef();
  const visualizerPanelRef = usePanelRef();
  const fileWorkspace = useFileWorkspace();
  const { registerCompileAction, registerPanelControls } = useIdeActions();
  const { compiling, log, setLog, handleCompile, handleJumpToError } = useIdeCompile(
    editorRef,
    fileWorkspace.activeDocument?.source ?? '',
  );

  const [explorerVisible, setExplorerVisible] = useState(true);
  const [logsVisible, setLogsVisible] = useState(true);
  const [visualizerVisible, setVisualizerVisible] = useState(true);
  const [closeRequest, setCloseRequest] = useState<CloseRequest | null>(null);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  useLogsPanelShortcut(logsPanelRef);

  const { authenticated, activeDocument, openTabs, forceCloseTab, saveAndCloseTab, saveScratchAs } =
    fileWorkspace;

  const requestCloseTab = useCallback(
    async (key: string) => {
      const tab = openTabs.find((item) => item.key === key);
      if (!tab) return;

      const dirty = tab.syncState === 'out-of-sync' || tab.syncState === 'saving';

      if (tab.kind === 'scratch') {
        setCloseRequest({ key, name: tab.name, kind: 'scratch' });
        return;
      }

      if (tab.kind === 'example' || !dirty) {
        forceCloseTab(key);
        return;
      }

      const saved = await saveAndCloseTab(key);
      if (!saved) {
        setCloseRequest({ key, name: tab.name, kind: 'user' });
      }
    },
    [forceCloseTab, openTabs, saveAndCloseTab],
  );

  const openSaveAs = useCallback(() => {
    setSaveAsName('');
    setSaveAsOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!activeDocument) return;

    if (activeDocument.kind === 'scratch') {
      openSaveAs();
      return;
    }
    if (activeDocument.kind === 'user') {
      void fileWorkspace.saveActiveDocument();
    }
  }, [activeDocument, fileWorkspace, openSaveAs]);

  useSaveShortcut(handleSave);

  const submitSaveAs = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const ok = await saveScratchAs(saveAsName);
      if (ok) setSaveAsOpen(false);
    },
    [saveAsName, saveScratchAs],
  );

  const makeToggle = useCallback(
    (ref: typeof explorerPanelRef, setVisible: (value: boolean) => void) => () => {
      const panel: PanelImperativeHandle | null = ref.current;
      if (!panel) return;
      if (panel.isCollapsed()) {
        panel.expand();
        setVisible(true);
      } else {
        panel.collapse();
        setVisible(false);
      }
    },
    [],
  );

  const toggleExplorer = useCallback(
    () => makeToggle(explorerPanelRef, setExplorerVisible)(),
    [explorerPanelRef, makeToggle],
  );
  const toggleLogs = useCallback(
    () => makeToggle(logsPanelRef, setLogsVisible)(),
    [logsPanelRef, makeToggle],
  );
  const toggleVisualizer = useCallback(
    () => makeToggle(visualizerPanelRef, setVisualizerVisible)(),
    [makeToggle, visualizerPanelRef],
  );

  const openLogsPanel = useCallback(() => {
    const panel = logsPanelRef.current;
    if (panel?.isCollapsed()) {
      panel.expand();
    }
    setLogsVisible(true);
  }, [logsPanelRef]);

  const runCompile = useCallback(() => {
    openLogsPanel();
    void handleCompile();
  }, [handleCompile, openLogsPanel]);

  const syncVisibility = (setVisible: (value: boolean) => void) => (size: PanelSize) =>
    setVisible(size.asPercentage > 0.01);

  useEffect(() => {
    registerCompileAction({ compiling, canCompile: true, run: runCompile });
  }, [compiling, registerCompileAction, runCompile]);

  useEffect(() => {
    registerPanelControls({
      explorerVisible,
      logsVisible,
      visualizerVisible,
      toggleExplorer,
      toggleLogs,
      toggleVisualizer,
    });
  }, [
    explorerVisible,
    logsVisible,
    registerPanelControls,
    toggleExplorer,
    toggleLogs,
    toggleVisualizer,
    visualizerVisible,
  ]);

  return (
    <>
      <Group orientation="horizontal" className="min-h-0 min-w-0 flex-1">
        <Panel
          panelRef={explorerPanelRef}
          onResize={syncVisibility(setExplorerVisible)}
          defaultSize="256px"
          minSize="200px"
          maxSize="50%"
          collapsible
          collapsedSize="0%"
          className="min-w-0"
        >
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
            onDownloadExampleFile={fileWorkspace.downloadExampleFile}
            onDownloadFile={fileWorkspace.downloadUserFile}
            onOpenExample={fileWorkspace.openExample}
            onOpenUserFile={fileWorkspace.openUserFile}
            onRefresh={fileWorkspace.refresh}
            onRenameFile={fileWorkspace.renameUserFile}
          />
        </Panel>

        <ResizeHandle direction="horizontal" />

        <Panel defaultSize="50%" minSize="35%" className="min-w-0">
          <Group orientation="vertical" className="min-h-0 min-w-0">
            <EditorPane
              activeDocument={fileWorkspace.activeDocument}
              activeTabKey={fileWorkspace.activeTabKey}
              MotivoEditor={MotivoEditor}
              editorRef={editorRef}
              openTabs={fileWorkspace.openTabs}
              onCloseTab={requestCloseTab}
              onDownloadActiveFile={fileWorkspace.downloadActiveDocument}
              onCompile={runCompile}
              onEditorChange={(documentId, value) =>
                fileWorkspace.handleSourceChange(documentId, value)
              }
              onFocusTab={fileWorkspace.focusTab}
            />

            <ResizeHandle direction="vertical" />

            <LogsPanel
              panelRef={logsPanelRef}
              onResize={syncVisibility(setLogsVisible)}
              log={log}
              setLog={setLog}
              onJump={handleJumpToError}
            />
          </Group>
        </Panel>

        <ResizeHandle direction="horizontal" />

        <VisualizerPane
          panelRef={visualizerPanelRef}
          onResize={syncVisibility(setVisualizerVisible)}
          PianoRoll={PianoRoll}
        />
      </Group>

      <Dialog
        open={closeRequest !== null}
        onOpenChange={(open) => {
          if (!open) setCloseRequest(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          {closeRequest?.kind === 'user' ? (
            <>
              <DialogHeader>
                <DialogTitle>Couldn&apos;t save {closeRequest.name}</DialogTitle>
                <DialogDescription>
                  There was a problem saving your changes. Close this file without saving?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloseRequest(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    forceCloseTab(closeRequest.key);
                    setCloseRequest(null);
                  }}
                >
                  Don&apos;t Save
                </Button>
              </DialogFooter>
            </>
          ) : closeRequest ? (
            <>
              <DialogHeader>
                <DialogTitle>Save changes before closing?</DialogTitle>
                <DialogDescription>
                  Your changes will be lost if you don&apos;t save them.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloseRequest(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    forceCloseTab(closeRequest.key);
                    setCloseRequest(null);
                  }}
                >
                  Don&apos;t Save
                </Button>
                <Button
                  onClick={() => {
                    setCloseRequest(null);
                    openSaveAs();
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <form onSubmit={submitSaveAs}>
            <DialogHeader>
              <DialogTitle>Save file</DialogTitle>
              <DialogDescription>
                {authenticated
                  ? 'Choose a name for your new file.'
                  : 'Sign in to save files to your workspace.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                autoFocus
                value={saveAsName}
                onChange={(event) => setSaveAsName(event.target.value)}
                placeholder="name.motivo"
                disabled={!authenticated}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSaveAsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!authenticated || !saveAsName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
