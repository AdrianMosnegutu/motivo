import { z } from 'zod/v3';

const fileNameSchema = z
  .string({ required_error: 'name is required' })
  .transform((name) => name.trim())
  .refine((name) => name.length > 0, 'name is required')
  .refine((name) => name.length <= 255, 'name must be at most 255 characters');

const fileSourceSchema = z.string({ required_error: 'source is required' });

export const fileIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
});

export const createFileSchema = z.object({
  body: z.object({
    name: fileNameSchema,
    source: fileSourceSchema,
  }),
});

export const updateFileSchema = z.object({
  params: fileIdParamsSchema.shape.params,
  body: z
    .object({
      name: fileNameSchema.optional(),
      source: fileSourceSchema.optional(),
    })
    .refine((body) => body.name !== undefined || body.source !== undefined, {
      message: 'name or source is required',
    }),
});

export type FileIdParams = z.infer<typeof fileIdParamsSchema>['params'];
export type CreateFileSchema = z.infer<typeof createFileSchema>['body'];
export type UpdateFileSchema = z.infer<typeof updateFileSchema>['body'];
