'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import {
  Check,
  Download,
  FilePlus2,
  Lock,
  Music4,
  PencilLine,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type { ActiveDocument, ExampleFileSummary, UserFileSummary } from '../types';

type ActionResult = boolean | Promise<boolean>;

interface FileExplorerProps {
  activeDocument: ActiveDocument | null;
  authLoading: boolean;
  authenticated: boolean;
  examples: ExampleFileSummary[];
  filesLoading: boolean;
  operationError: string | null;
  userFiles: UserFileSummary[];
  onCreateFile: (name: string) => ActionResult;
  onDeleteFile: (id: string) => ActionResult;
  onDownloadExampleFile: (id: string) => ActionResult;
  onDownloadFile: (id: string) => ActionResult;
  onOpenExample: (id: string) => void;
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
    <Button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      disabled={disabled}
      onClick={onClick}
      variant="ghost"
      size="icon-sm"
      className="text-[#858585] hover:text-foreground"
    >
      {children}
    </Button>
  );
}

const ROW_BASE =
  'flex w-full cursor-pointer items-center gap-2 border-l-2 px-4 py-1.5 text-left text-[13px] transition-colors';

function rowClass(active: boolean) {
  return cn(
    ROW_BASE,
    active
      ? 'border-[#3b82f6] bg-[#1e232d] font-medium text-white'
      : 'border-transparent text-[#cccccc] hover:bg-muted hover:text-white',
  );
}

function fileIcon(name: string) {
  if (name.endsWith('.json')) return <Settings aria-hidden className="size-3.5 text-[#94a3b8]" />;
  return <Music4 aria-hidden className="size-3.5 shrink-0 text-[#38bdf8]" />;
}

function isActiveDocument(
  activeDocument: ActiveDocument | null,
  kind: 'user' | 'example',
  id: string,
) {
  return activeDocument?.kind === kind && activeDocument.id === id;
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
  onDownloadExampleFile,
  onDownloadFile,
  onOpenExample,
  onOpenUserFile,
  onRefresh,
  onRenameFile,
}: FileExplorerProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserFileSummary | null>(null);

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

  const startCreate = () => {
    setRenamingFileId(null);
    setCreating(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDeleteFile(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-[#2a303c] bg-[#0b0e14]">
      <div className="flex shrink-0 items-center justify-between border-b border-[rgba(43,45,49,0.5)] px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#858585]">
          Files
        </span>
        <div className="flex items-center gap-0.5">
          <IconButton
            aria-label="Refresh files"
            title="Refresh files"
            disabled={authLoading || filesLoading}
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden />
          </IconButton>
          <IconButton
            aria-label="New file"
            title="New file"
            disabled={!authenticated}
            onClick={() => setCreating((value) => !value)}
          >
            <FilePlus2 aria-hidden />
          </IconButton>
        </div>
      </div>

      <Tabs defaultValue="workspace" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 px-3 py-2">
          <TabsList className="w-full bg-[#151921]">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="workspace" className="min-h-0">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <ScrollArea className="h-full">
                <div className="flex min-h-full flex-col py-1">
                  {!authenticated ? (
                    <div className="px-4 py-1.5 text-[13px] text-muted-foreground">
                      Sign in to save files.
                    </div>
                  ) : null}

                  {authenticated && creating ? (
                    <form onSubmit={submitCreate} className="flex items-center gap-1 px-3 py-1">
                      <Input
                        autoFocus
                        value={newFileName}
                        onChange={(event) => setNewFileName(event.target.value)}
                        placeholder="New file name"
                        className="h-7 min-w-0 flex-1 text-xs"
                      />
                      <IconButton
                        type="submit"
                        aria-label="Create file"
                        disabled={!newFileName.trim()}
                      >
                        <Check aria-hidden />
                      </IconButton>
                      <IconButton
                        aria-label="Cancel create"
                        onClick={() => {
                          setCreating(false);
                          setNewFileName('');
                        }}
                      >
                        <X aria-hidden />
                      </IconButton>
                    </form>
                  ) : null}

                  {authenticated && filesLoading ? (
                    <div className="px-4 py-1.5 text-[13px] text-muted-foreground">
                      Loading files...
                    </div>
                  ) : null}

                  {authenticated && !filesLoading && userFiles.length === 0 ? (
                    <div className="px-4 py-1.5 text-[13px] text-muted-foreground">
                      No saved files.
                    </div>
                  ) : null}

                  {authenticated
                    ? userFiles.map((file) => {
                        const active = isActiveDocument(activeDocument, 'user', file.id);

                        if (renamingFileId === file.id) {
                          return (
                            <form
                              key={file.id}
                              onSubmit={(event) => submitRename(event, file.id)}
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Input
                                autoFocus
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                className="h-7 min-w-0 flex-1 text-xs"
                              />
                              <IconButton
                                type="submit"
                                aria-label={`Save ${file.name}`}
                                disabled={!renameValue.trim()}
                              >
                                <Check aria-hidden />
                              </IconButton>
                              <IconButton
                                aria-label={`Cancel rename ${file.name}`}
                                onClick={() => setRenamingFileId(null)}
                              >
                                <X aria-hidden />
                              </IconButton>
                            </form>
                          );
                        }

                        return (
                          <ContextMenu key={file.id}>
                            <ContextMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={() => void onOpenUserFile(file.id)}
                                className={rowClass(active)}
                              >
                                {fileIcon(file.name)}
                                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onSelect={() => void onOpenUserFile(file.id)}>
                                Open
                              </ContextMenuItem>
                              <ContextMenuItem
                                disabled={!authenticated}
                                onSelect={() => beginRename(file)}
                              >
                                <PencilLine aria-hidden />
                                Rename
                              </ContextMenuItem>
                              <ContextMenuItem
                                disabled={!authenticated}
                                onSelect={() => void onDownloadFile(file.id)}
                              >
                                <Download aria-hidden />
                                Download
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                variant="destructive"
                                disabled={!authenticated}
                                onSelect={() => setDeleteTarget(file)}
                              >
                                <Trash2 aria-hidden />
                                Delete
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })
                    : null}
                </div>
              </ScrollArea>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem disabled={!authenticated} onSelect={startCreate}>
                <FilePlus2 aria-hidden />
                New File
              </ContextMenuItem>
              <ContextMenuItem onSelect={onRefresh}>
                <RefreshCw aria-hidden />
                Refresh
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </TabsContent>

        <TabsContent value="examples" className="min-h-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col py-1">
              {examples.map((example) => {
                const active = isActiveDocument(activeDocument, 'example', example.id);

                return (
                  <ContextMenu key={example.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${example.name} read-only`}
                        onClick={() => onOpenExample(example.id)}
                        className={rowClass(active)}
                      >
                        <Music4 aria-hidden className="size-3.5 shrink-0 text-[#a855f7]" />
                        <span className="min-w-0 flex-1 truncate">{example.name}</span>
                        <Lock
                          aria-label="Read-only"
                          className="size-3 shrink-0 text-muted-foreground"
                        />
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => onOpenExample(example.id)}>
                        Open
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => void onDownloadExampleFile(example.id)}>
                        <Download aria-hidden />
                        Download
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem disabled>Rename</ContextMenuItem>
                      <ContextMenuItem disabled>Delete</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {operationError ? (
        <div
          role="alert"
          className="shrink-0 border-t border-border px-4 py-2 text-[13px] text-red-500"
        >
          {operationError}
        </div>
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the file from your workspace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
