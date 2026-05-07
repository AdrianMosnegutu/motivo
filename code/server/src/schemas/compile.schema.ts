import { z } from 'zod/v3';

export const compileSourceSchema = z.object({
  body: z.object({
    source: z
      .string({ required_error: 'source is required' })
      .refine((source) => source.trim().length > 0, 'source is required'),
  }),
});

export type CompileSourceSchema = z.infer<typeof compileSourceSchema>['body'];
