import { Router } from 'express';

import {
  createFileController,
  deleteFileController,
  downloadFileController,
  listFilesController,
  openFileController,
  updateFileController,
} from '@/controllers/files.controller';
import { asyncHandler } from '@/middleware/async-handler';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createFileSchema, fileIdParamsSchema, updateFileSchema } from '@/schemas/file.schema';

const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.get('/', asyncHandler(listFilesController));
filesRouter.post('/', validate(createFileSchema), asyncHandler(createFileController));
filesRouter.get('/:id', validate(fileIdParamsSchema), asyncHandler(openFileController));
filesRouter.patch('/:id', validate(updateFileSchema), asyncHandler(updateFileController));
filesRouter.delete('/:id', validate(fileIdParamsSchema), asyncHandler(deleteFileController));
filesRouter.get(
  '/:id/download',
  validate(fileIdParamsSchema),
  asyncHandler(downloadFileController),
);

export default filesRouter;
