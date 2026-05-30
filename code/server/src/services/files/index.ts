import { FileNameConflictError, FileNotFoundError } from '@/services/files/errors';
import {
  createFile as createFileRecord,
  deleteFileByOwner,
  findFileByOwner,
  listFilesByOwner,
  openFileByOwner,
  updateFileByOwner,
} from '@/services/files/repository';
import {
  type CreateFileInput,
  type FileDto,
  type MotivoFile,
  type UpdateFileInput,
} from '@/services/files/types';

function toFileDto(file: MotivoFile, options: { includeSource: boolean }): FileDto {
  return {
    id: file.id,
    name: file.name,
    ...(options.includeSource ? { source: file.source } : {}),
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    lastOpenedAt: file.lastOpenedAt?.toISOString() ?? null,
  };
}

export async function listFiles(ownerId: string): Promise<FileDto[]> {
  const files = await listFilesByOwner(ownerId);
  return files.map((file) => toFileDto(file, { includeSource: false }));
}

export async function createFile(ownerId: string, input: CreateFileInput): Promise<FileDto> {
  const file = await createFileRecord(ownerId, input);
  return toFileDto(file, { includeSource: true });
}

export async function openFile(ownerId: string, fileId: string): Promise<FileDto> {
  const file = await openFileByOwner(ownerId, fileId);

  if (!file) {
    throw new FileNotFoundError();
  }

  return toFileDto(file, { includeSource: true });
}

export async function updateFile(
  ownerId: string,
  fileId: string,
  input: UpdateFileInput,
): Promise<FileDto> {
  const file = await updateFileByOwner(ownerId, fileId, input);

  if (!file) {
    throw new FileNotFoundError();
  }

  return toFileDto(file, { includeSource: true });
}

export async function deleteFile(ownerId: string, fileId: string): Promise<void> {
  const deleted = await deleteFileByOwner(ownerId, fileId);

  if (!deleted) {
    throw new FileNotFoundError();
  }
}

export async function getDownload(ownerId: string, fileId: string): Promise<FileDto> {
  const file = await findFileByOwner(ownerId, fileId);

  if (!file) {
    throw new FileNotFoundError();
  }

  return toFileDto(file, { includeSource: true });
}

export { FileNameConflictError, FileNotFoundError };
