import { type NextFunction, type Request, type Response } from 'express';
import { type ZodSchema } from 'zod/v3';

import { AppError } from '@/middleware/errors';

type RequestSchemaOutput = {
  body?: unknown;
  params?: Request['params'];
  query?: Request['query'];
};

type ValidatableRequest = Request<Request['params'], unknown, unknown, Request['query']>;

export const validate =
  (schema: ZodSchema<RequestSchemaOutput>) =>
  (req: ValidatableRequest, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'request validation failed', {
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      );
    }

    req.body = result.data.body;
    req.query = result.data.query ?? req.query;
    req.params = result.data.params ?? req.params;

    next();
  };
