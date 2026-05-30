'use client';

import type { ComponentType, RefAttributes, RefObject } from 'react';
import { Panel } from 'react-resizable-panels';
import { Download, FileCode2, Music4, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type {
  MotivoEditorHandle,
  MotivoEditorProps,
} from '@/features/editor/components/MotivoEditor';
import type { ActiveDocument, OpenDocumentTab } from '@/features/files/types';
import { cn } from '@/lib/utils';

type EditorComponent = ComponentType<MotivoEditorProps & RefAttributes<MotivoEditorHandle>>;

interface EditorPaneProps {
  activeDocument: ActiveDocument | null;
  activeTabKey: string;
  MotivoEditor: EditorComponent;
  openTabs: OpenDocumentTab[];
  editorRef: RefObject<MotivoEditorHandle | null>;
  onCloseTab: (key: string) => void;
  onCompile: () => void;
  onDownloadActiveFile: () => void | Promise<boolean>;
  onEditorChange: (documentId: string, value: string) => void;
  onFocusTab: (key: string) => void;
}

function tabIcon(tab: OpenDocumentTab) {
  if (tab.kind === 'scratch') {
    return <FileCode2 aria-hidden className="size-3 shrink-0 text-[#94a3b8]" />;
  }
  if (tab.kind === 'example') {
    return <Music4 aria-hidden className="size-3 shrink-0 text-[#a855f7]" />;
  }
  return <Music4 aria-hidden className="size-3 shrink-0 text-[#38bdf8]" />;
}

function TabCloseControl({
  tab,
  onClose,
}: {
  tab: OpenDocumentTab;
  onClose: (key: string) => void;
}) {
  const unsaved = tab.syncState === 'out-of-sync' || tab.syncState === 'saving';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`Close ${tab.name}`}
      className="relative size-4 text-muted-foreground hover:text-foreground"
      onClick={(event) => {
        event.stopPropagation();
        onClose(tab.key);
      }}
    >
      {unsaved ? (
        <span
          aria-hidden
          className="absolute size-2 rounded-full bg-current group-hover/tab:hidden"
        />
      ) : null}
      <X aria-hidden className={cn(unsaved && 'hidden group-hover/tab:block')} />
    </Button>
  );
}

export default function EditorPane({
  activeDocument,
  activeTabKey,
  MotivoEditor,
  openTabs,
  editorRef,
  onCloseTab,
  onDownloadActiveFile,
  onCompile,
  onEditorChange,
  onFocusTab,
}: EditorPaneProps) {
  const canDownloadActiveFile = activeDocument !== null && activeDocument.kind !== 'scratch';

  return (
    <Panel
      defaultSize="70%"
      minSize="20%"
      className="flex min-h-0 flex-col overflow-hidden border border-[#2a303c] bg-[#0b0e14]"
    >
      <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-[#2a303c] bg-[#151921] px-2">
        {openTabs.map((tab) => {
          const active = tab.key === activeTabKey;

          return (
            <ContextMenu key={tab.key}>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    'group/tab relative flex h-full min-w-0 items-center gap-2 rounded-t-md border-x border-t px-4 text-[14px]',
                    active
                      ? 'border-[#2a303c] bg-[#0b0e14] text-white'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-0.5 rounded-t-md bg-[#38bdf8]"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onFocusTab(tab.key)}
                    className="flex min-w-0 cursor-pointer items-center gap-2 py-2 text-left"
                  >
                    {tabIcon(tab)}
                    <span className="max-w-44 truncate">{tab.name}</span>
                  </button>
                  {tab.closable ? (
                    <TabCloseControl tab={tab} onClose={(key) => void onCloseTab(key)} />
                  ) : null}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => onFocusTab(tab.key)}>Open</ContextMenuItem>
                {active && canDownloadActiveFile ? (
                  <ContextMenuItem onSelect={() => void onDownloadActiveFile()}>
                    <Download aria-hidden />
                    Download
                  </ContextMenuItem>
                ) : null}
                {tab.closable ? (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      onSelect={() => void onCloseTab(tab.key)}
                    >
                      <X aria-hidden />
                      Close
                    </ContextMenuItem>
                  </>
                ) : null}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        {activeDocument ? (
          <MotivoEditor
            ref={editorRef}
            documentId={`${activeDocument.kind}:${activeDocument.id}`}
            onChange={onEditorChange}
            onCompile={onCompile}
            readOnly={activeDocument.readOnly}
            value={activeDocument.source}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Open a file from the explorer to start editing.
          </div>
        )}
      </div>
    </Panel>
  );
}
