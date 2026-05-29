import { type NextFunction, type Request, type Response } from 'express';

import { AppError } from '@/middleware/errors';
import {
  type CreateFileSchema,
  type FileIdParams,
  type UpdateFileSchema,
} from '@/schemas/file.schema';
import {
  createFile,
  deleteFile,
  FileNameConflictError,
  FileNotFoundError,
  getDownload,
  listFiles,
  openFile,
  updateFile,
} from '@/services/files';

function getOwnerId(req: Request): string {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'authentication required');
  }

  return req.user.id;
}

function mapFileError(error: unknown, next: NextFunction): void {
  if (error instanceof FileNotFoundError) {
    next(new AppError(404, 'FILE_NOT_FOUND', 'file not found'));
    return;
  }

  if (error instanceof FileNameConflictError) {
    next(new AppError(409, 'FILE_NAME_CONFLICT', 'file name already exists'));
    return;
  }

  next(error);
}

function downloadFileName(name: string): string {
  const sanitized = name.replace(/[\\/]/g, '-');
  return sanitized.toLowerCase().endsWith('.motivo') ? sanitized : `${sanitized}.motivo`;
}

export async function listFilesController(req: Request, res: Response, next: NextFunction) {
  try {
    const files = await listFiles(getOwnerId(req));
    res.status(200).json({ files });
  } catch (error) {
    mapFileError(error, next);
  }
}

export async function createFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const file = await createFile(getOwnerId(req), req.body as CreateFileSchema);
    res.status(201).json({ file });
  } catch (error) {
    mapFileError(error, next);
  }
}

export async function openFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as FileIdParams;
    const file = await openFile(getOwnerId(req), id);
    res.status(200).json({ file });
  } catch (error) {
    mapFileError(error, next);
  }
}

export async function updateFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as FileIdParams;
    const file = await updateFile(getOwnerId(req), id, req.body as UpdateFileSchema);
    res.status(200).json({ file });
  } catch (error) {
    mapFileError(error, next);
  }
}

export async function deleteFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as FileIdParams;
    await deleteFile(getOwnerId(req), id);
    res.status(204).send();
  } catch (error) {
    mapFileError(error, next);
  }
}

export async function downloadFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as FileIdParams;
    const file = await getDownload(getOwnerId(req), id);

    res.attachment(downloadFileName(file.name));
    res.type('text/plain; charset=utf-8');
    res.status(200).send(file.source);
  } catch (error) {
    mapFileError(error, next);
  }
}
