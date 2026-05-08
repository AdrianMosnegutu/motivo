'use client';

import type { ComponentType, RefAttributes, RefObject } from 'react';
import { Panel } from 'react-resizable-panels';

import type {
  MotivoEditorHandle,
  MotivoEditorProps,
} from '@/features/editor/components/MotivoEditor';
import Spinner from '@/shared/components/Spinner';

type EditorComponent = ComponentType<MotivoEditorProps & RefAttributes<MotivoEditorHandle>>;

interface EditorPaneProps {
  MotivoEditor: EditorComponent;
  editorRef: RefObject<MotivoEditorHandle | null>;
  compiling: boolean;
  onCompile: () => void;
  onEditorChange: (value: string) => void;
}

export default function EditorPane({
  MotivoEditor,
  editorRef,
  compiling,
  onCompile,
  onEditorChange,
}: EditorPaneProps) {
  return (
    <Panel defaultSize={70} minSize={20} className="flex flex-col min-h-0">
      <div className="shrink-0 flex items-center gap-3 px-3 h-10 border-b border-border bg-toolbar">
        <button
          onClick={onCompile}
          disabled={compiling}
          className="flex items-center gap-2 px-3 h-7 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-mono font-medium transition-colors"
        >
          {compiling ? <Spinner /> : null}
          {compiling ? 'Compiling...' : 'Compile'}
        </button>
        <span className="text-zinc-400 text-xs font-mono">Cmd+Enter / Ctrl+Enter</span>
      </div>
      <div className="flex-1 min-h-0">
        <MotivoEditor ref={editorRef} onChange={onEditorChange} onCompile={onCompile} />
      </div>
    </Panel>
  );
}
