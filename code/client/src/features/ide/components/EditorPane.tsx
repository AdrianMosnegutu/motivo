'use client';

import type { ComponentType, RefAttributes, RefObject } from 'react';
import { Panel } from 'react-resizable-panels';
import { Download, Play } from 'lucide-react';

import type {
  MotivoEditorHandle,
  MotivoEditorProps,
} from '@/features/editor/components/MotivoEditor';
import type { ActiveDocument, AutosaveStatus } from '@/features/files/types';
import Spinner from '@/shared/components/Spinner';

type EditorComponent = ComponentType<MotivoEditorProps & RefAttributes<MotivoEditorHandle>>;

interface EditorPaneProps {
  activeDocument: ActiveDocument;
  autosaveStatus: AutosaveStatus;
  MotivoEditor: EditorComponent;
  editorRef: RefObject<MotivoEditorHandle | null>;
  compiling: boolean;
  onDownloadActiveFile: () => void;
  onCompile: () => void;
  onEditorChange: (value: string) => void;
}

function getDocumentModeLabel(document: ActiveDocument) {
  if (document.kind === 'example') return 'Read-only example';
  if (document.kind === 'scratch') return 'Scratch';
  return 'Saved file';
}

function getSaveStatusLabel(document: ActiveDocument, status: AutosaveStatus) {
  if (document.kind === 'example') return 'Read-only';
  if (document.kind === 'scratch') return 'Not saved';

  switch (status) {
    case 'pending':
      return 'Unsaved changes';
    case 'saving':
      return 'Saving...';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Save failed';
    case 'idle':
    default:
      return 'Ready';
  }
}

export default function EditorPane({
  activeDocument,
  autosaveStatus,
  MotivoEditor,
  editorRef,
  compiling,
  onDownloadActiveFile,
  onCompile,
  onEditorChange,
}: EditorPaneProps) {
  const canDownloadActiveFile = activeDocument.kind === 'user';

  return (
    <Panel defaultSize="70%" minSize="20%" className="flex min-h-0 flex-col">
      <div className="shrink-0 flex items-center gap-3 px-3 h-10 border-b border-border bg-toolbar">
        <button
          onClick={onCompile}
          disabled={compiling}
          className="flex items-center gap-2 px-3 h-7 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-mono font-medium transition-colors"
        >
          {compiling ? <Spinner /> : null}
          {!compiling ? <Play size={13} aria-hidden /> : null}
          {compiling ? 'Compiling...' : 'Compile'}
        </button>
        <div className="min-w-0 flex flex-1 items-center gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <span className="truncate text-xs font-semibold">{activeDocument.name}</span>
            <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
              {getDocumentModeLabel(activeDocument)}
            </span>
          </div>
          <span className="shrink-0 text-xs text-zinc-500">
            {getSaveStatusLabel(activeDocument, autosaveStatus)}
          </span>
        </div>
        <button
          type="button"
          aria-label="Download source"
          title="Download source"
          disabled={!canDownloadActiveFile}
          onClick={onDownloadActiveFile}
          className="grid size-7 place-items-center rounded border border-border text-zinc-500 hover:text-foreground hover:bg-zinc-200/70 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={14} aria-hidden />
        </button>
        <span className="hidden text-zinc-400 text-xs font-mono md:inline">
          Cmd+Enter / Ctrl+Enter
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <MotivoEditor
          ref={editorRef}
          documentId={`${activeDocument.kind}:${activeDocument.id}`}
          onChange={onEditorChange}
          onCompile={onCompile}
          readOnly={activeDocument.readOnly}
          value={activeDocument.source}
        />
      </div>
    </Panel>
  );
}
