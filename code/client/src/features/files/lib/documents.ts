import { DEFAULT_MOTIVO_SNIPPET } from '@/features/editor/monaco/monaco-config';

import type {
  ActiveDocument,
  ExampleFile,
  ScratchDocument,
  UserDocument,
  UserFile,
  UserFileSummary,
} from '../types';

export const SCRATCH_DOCUMENT_ID = 'scratch';
export const SCRATCH_DOCUMENT_NAME = 'unsaved';

export function getDocumentKey(input: Pick<ActiveDocument, 'id' | 'kind'>): string {
  return `${input.kind}:${input.id}`;
}

export function createScratchDocument(source = DEFAULT_MOTIVO_SNIPPET): ScratchDocument {
  return {
    kind: 'scratch',
    id: SCRATCH_DOCUMENT_ID,
    name: SCRATCH_DOCUMENT_NAME,
    source,
    readOnly: false,
    persisted: false,
  };
}

export function toUserFileSummary(file: UserFile): UserFileSummary {
  return {
    kind: 'user',
    id: file.id,
    name: file.name,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    lastOpenedAt: file.lastOpenedAt,
    readOnly: false,
  };
}

export function toUserDocument(file: UserFile): UserDocument {
  return {
    ...file,
    kind: 'user',
    readOnly: false,
    persisted: true,
  };
}

export function toExampleDocument(file: ExampleFile): ActiveDocument {
  return {
    ...file,
    persisted: false,
  };
}

export function ensureMotivoFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'unsaved.motivo';
  return trimmed.toLowerCase().endsWith('.motivo') ? trimmed : `${trimmed}.motivo`;
}

export function compareUserFileNames(a: UserFileSummary, b: UserFileSummary): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

export function sortUserFiles(files: UserFileSummary[]): UserFileSummary[] {
  return [...files].sort(compareUserFileNames);
}

export function upsertUserFileSummary(files: UserFileSummary[], file: UserFile): UserFileSummary[] {
  const summary = toUserFileSummary(file);
  const index = files.findIndex((item) => item.id === summary.id);

  if (index === -1) {
    return sortUserFiles([...files, summary]);
  }

  const previous = files[index];
  const next = [...files];
  next[index] = summary;

  if (previous.name === summary.name) {
    return next;
  }

  return sortUserFiles(next);
}
