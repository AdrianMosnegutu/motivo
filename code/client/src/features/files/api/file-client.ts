import type { UserFile, UserFileSummary } from '../types';

import { createFileApiError } from './errors';

const FILES_ROUTE = '/api/files';

interface UserFileDto {
  id: string;
  name: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

interface FetchOptions extends RequestInit {
  suppressAuthError?: boolean;
}

function toUserFileSummary(dto: UserFileDto): UserFileSummary {
  return {
    kind: 'user',
    id: dto.id,
    name: dto.name,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    lastOpenedAt: dto.lastOpenedAt,
    readOnly: false,
  };
}

function toUserFile(dto: UserFileDto): UserFile {
  return {
    ...toUserFileSummary(dto),
    source: dto.source ?? '',
  };
}

async function requestJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await createFileApiError(response, 'File request failed');
  }

  return (await response.json()) as T;
}

export async function listFiles(): Promise<UserFileSummary[]> {
  const payload = await requestJson<{ files: UserFileDto[] }>(FILES_ROUTE);
  return payload.files.map(toUserFileSummary);
}

export async function createFile(input: { name: string; source: string }): Promise<UserFile> {
  const payload = await requestJson<{ file: UserFileDto }>(FILES_ROUTE, {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return toUserFile(payload.file);
}

export async function readFile(id: string): Promise<UserFile> {
  const payload = await requestJson<{ file: UserFileDto }>(`${FILES_ROUTE}/${id}`);
  return toUserFile(payload.file);
}

export async function updateFile(
  id: string,
  input: { name?: string; source?: string },
): Promise<UserFile> {
  const payload = await requestJson<{ file: UserFileDto }>(`${FILES_ROUTE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return toUserFile(payload.file);
}

export async function deleteFile(id: string): Promise<void> {
  const response = await fetch(`${FILES_ROUTE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw await createFileApiError(response, 'Delete failed');
  }
}

function readDownloadFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function downloadFile(
  id: string,
  fallbackName: string,
): Promise<{
  blob: Blob;
  filename: string;
}> {
  const response = await fetch(`${FILES_ROUTE}/${id}/download`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw await createFileApiError(response, 'Download failed');
  }

  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response, fallbackName),
  };
}
