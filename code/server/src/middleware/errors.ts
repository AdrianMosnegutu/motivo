import { type ErrorRequestHandler } from 'express';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'COMPILER_BINARY_NOT_FOUND'
  | 'COMPILER_EXECUTION_FAILED'
  | 'COMPILER_OUTPUT_MISSING'
  | 'COMPILER_IO_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error =
    err instanceof AppError
      ? err
      : new AppError(500, 'INTERNAL_SERVER_ERROR', 'internal server error');

  return res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  });
};
