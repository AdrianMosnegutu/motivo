import { type NextFunction, type Request, type Response } from 'express';

import { type ApiErrorCode, AppError } from '@/middleware/errors';
import { type CompileSourceSchema } from '@/schemas/compile.schema';
import { compile } from '@/services/compiler';
import { type CompileResult, type CompilerInfrastructureErrorCode, } from '@/services/compiler/types';

export type CompileService = (source: string) => Promise<CompileResult>;

const infrastructureStatus: Record<
  CompilerInfrastructureErrorCode,
  { statusCode: number; code: ApiErrorCode }
> = {
  COMPILER_BINARY_NOT_FOUND: {
    statusCode: 500,
    code: 'COMPILER_BINARY_NOT_FOUND',
  },
  COMPILER_EXECUTION_FAILED: {
    statusCode: 500,
    code: 'COMPILER_EXECUTION_FAILED',
  },
  COMPILER_OUTPUT_MISSING: {
    statusCode: 500,
    code: 'COMPILER_OUTPUT_MISSING',
  },
  COMPILER_IO_ERROR: {
    statusCode: 500,
    code: 'COMPILER_IO_ERROR',
  },
};

export function createCompileController(compileSource: CompileService = compile) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { source } = req.body as CompileSourceSchema;
    const result = await compileSource(source);

    switch (result.kind) {
      case 'success': {
        res.set('Content-Type', 'audio/midi');
        res.send(result.midi);
        return;
      }

      case 'diagnostics': {
        res.status(400).json({
          kind: 'error',
          diagnostics: result.diagnostics,
        });
        return;
      }

      case 'infrastructure_error': {
        const error = infrastructureStatus[result.code];
        next(new AppError(error.statusCode, error.code, result.message));
        return;
      }
    }
  };
}

export const compileController = createCompileController();
