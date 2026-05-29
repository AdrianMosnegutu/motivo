'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import {
  Check,
  Download,
  Edit3,
  FileCode2,
  FilePlus2,
  Folder,
  Lock,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

import type { ActiveDocument, ExampleFileSummary, UserFileSummary } from '../types';

type ActionResult = boolean | Promise<boolean>;

interface FileExplorerProps {
  activeDocument: ActiveDocument;
  authLoading: boolean;
  authenticated: boolean;
  examples: ExampleFileSummary[];
  filesLoading: boolean;
  operationError: string | null;
  userFiles: UserFileSummary[];
  onCreateFile: (name: string) => ActionResult;
  onDeleteFile: (id: string) => ActionResult;
  onDownloadFile: (id: string) => ActionResult;
  onOpenExample: (id: string) => void;
  onOpenScratch: () => void;
  onOpenUserFile: (id: string) => ActionResult;
  onRefresh: () => void;
  onRenameFile: (id: string, name: string) => ActionResult;
}

function IconButton({
  'aria-label': ariaLabel,
  children,
  disabled,
  onClick,
  title,
  type = 'button',
}: {
  'aria-label': string;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded border border-transparent text-zinc-500 hover:text-foreground hover:bg-zinc-200/70 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">
      {children}
    </div>
  );
}

function isActiveDocument(activeDocument: ActiveDocument, kind: 'user' | 'example', id: string) {
  return activeDocument.kind === kind && activeDocument.id === id;
}

export default function FileExplorer({
  activeDocument,
  authLoading,
  authenticated,
  examples,
  filesLoading,
  operationError,
  userFiles,
  onCreateFile,
  onDeleteFile,
  onDownloadFile,
  onOpenExample,
  onOpenScratch,
  onOpenUserFile,
  onRefresh,
  onRenameFile,
}: FileExplorerProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await onCreateFile(newFileName);
    if (!ok) return;
    setNewFileName('');
    setCreating(false);
  };

  const submitRename = async (event: FormEvent, id: string) => {
    event.preventDefault();
    const ok = await onRenameFile(id, renameValue);
    if (!ok) return;
    setRenamingFileId(null);
    setRenameValue('');
  };

  const beginRename = (file: UserFileSummary) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
  };

  const confirmDelete = async (file: UserFileSummary) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    await onDeleteFile(file.id);
  };

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-r border-border bg-panel">
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-border bg-toolbar">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Folder size={15} aria-hidden />
          Files
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label="Refresh files"
            title="Refresh files"
            disabled={authLoading || filesLoading}
            onClick={onRefresh}
          >
            <RefreshCw size={14} aria-hidden />
          </IconButton>
          <IconButton
            aria-label="New file"
            title="New file"
            disabled={!authenticated}
            onClick={() => setCreating((value) => !value)}
          >
            <FilePlus2 size={14} aria-hidden />
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <SectionHeader>Workspace</SectionHeader>
        <button
          type="button"
          onClick={onOpenScratch}
          className={`w-full flex items-center gap-2 px-3 h-8 text-left text-xs ${
            activeDocument.kind === 'scratch'
              ? 'bg-zinc-200 text-foreground dark:bg-zinc-800'
              : 'text-zinc-500 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
          }`}
        >
          <FileCode2 size={14} aria-hidden />
          <span className="truncate">Scratch.motivo</span>
        </button>

        <SectionHeader>Saved Files</SectionHeader>
        {!authenticated ? (
          <div className="px-3 text-xs text-zinc-500">Sign in to save files.</div>
        ) : null}
        {authenticated && creating ? (
          <form onSubmit={submitCreate} className="flex items-center gap-1 px-2 py-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(event) => setNewFileName(event.target.value)}
              placeholder="New file name"
              className="min-w-0 flex-1 h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:border-indigo-500"
            />
            <IconButton type="submit" aria-label="Create file" disabled={!newFileName.trim()}>
              <Check size={14} aria-hidden />
            </IconButton>
            <IconButton
              aria-label="Cancel create"
              onClick={() => {
                setCreating(false);
                setNewFileName('');
              }}
            >
              <X size={14} aria-hidden />
            </IconButton>
          </form>
        ) : null}
        {authenticated && filesLoading ? (
          <div className="px-3 text-xs text-zinc-500">Loading files...</div>
        ) : null}
        {authenticated && !filesLoading && userFiles.length === 0 ? (
          <div className="px-3 text-xs text-zinc-500">No saved files.</div>
        ) : null}
        {authenticated
          ? userFiles.map((file) => {
              const active = isActiveDocument(activeDocument, 'user', file.id);

              if (renamingFileId === file.id) {
                return (
                  <form
                    key={file.id}
                    onSubmit={(event) => submitRename(event, file.id)}
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="min-w-0 flex-1 h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:border-indigo-500"
                    />
                    <IconButton
                      type="submit"
                      aria-label={`Save ${file.name}`}
                      disabled={!renameValue.trim()}
                    >
                      <Check size={14} aria-hidden />
                    </IconButton>
                    <IconButton
                      aria-label={`Cancel rename ${file.name}`}
                      onClick={() => setRenamingFileId(null)}
                    >
                      <X size={14} aria-hidden />
                    </IconButton>
                  </form>
                );
              }

              return (
                <div
                  key={file.id}
                  className={`group flex items-center gap-1 px-2 h-8 ${
                    active ? 'bg-zinc-200 text-foreground dark:bg-zinc-800' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void onOpenUserFile(file.id)}
                    className="min-w-0 flex flex-1 items-center gap-2 text-left text-xs text-zinc-500 hover:text-foreground"
                  >
                    <FileCode2 size={14} aria-hidden className="shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                  <div className="hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
                    <IconButton
                      aria-label={`Rename ${file.name}`}
                      onClick={() => beginRename(file)}
                    >
                      <Edit3 size={13} aria-hidden />
                    </IconButton>
                    <IconButton
                      aria-label={`Download ${file.name}`}
                      onClick={() => void onDownloadFile(file.id)}
                    >
                      <Download size={13} aria-hidden />
                    </IconButton>
                    <IconButton
                      aria-label={`Delete ${file.name}`}
                      onClick={() => void confirmDelete(file)}
                    >
                      <Trash2 size={13} aria-hidden />
                    </IconButton>
                  </div>
                </div>
              );
            })
          : null}

        <SectionHeader>Examples</SectionHeader>
        {examples.map((example) => {
          const active = isActiveDocument(activeDocument, 'example', example.id);

          return (
            <button
              key={example.id}
              type="button"
              aria-label={`${example.name} read-only`}
              onClick={() => onOpenExample(example.id)}
              className={`w-full flex items-center gap-2 px-3 h-8 text-left text-xs ${
                active
                  ? 'bg-zinc-200 text-foreground dark:bg-zinc-800'
                  : 'text-zinc-500 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <FileCode2 size={14} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{example.name}</span>
              <Lock size={12} aria-label="Read-only" className="shrink-0" />
            </button>
          );
        })}
      </div>

      {operationError ? (
        <div
          role="alert"
          className="shrink-0 border-t border-border px-3 py-2 text-xs text-red-500"
        >
          {operationError}
        </div>
      ) : null}
    </aside>
  );
}
