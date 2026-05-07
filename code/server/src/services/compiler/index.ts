import { execFile, type ExecFileException } from 'child_process';
import { randomUUID } from 'crypto';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import environment from '@/config';
import { parseCompilerDiagnostics } from '@/services/compiler/diagnostics';
import {
  type CompileResult,
  type CompilerInfrastructureError,
  type CompilerInfrastructureErrorCode,
} from '@/services/compiler/types';

function infrastructureError(
  code: CompilerInfrastructureErrorCode,
  message: string,
): CompilerInfrastructureError {
  return { kind: 'infrastructure_error', code, message };
}

function runCompiler(
  binary: string,
  sourcePath: string,
): Promise<{ error: ExecFileException | null; stderr: string }> {
  return new Promise((resolve) => {
    execFile(binary, [sourcePath], (error, _stdout, stderr) => {
      resolve({ error, stderr });
    });
  });
}

export async function compile(source: string): Promise<CompileResult> {
  const id = randomUUID();
  const src = join(tmpdir(), `dsl-${id}.dsl`);
  const out = join(tmpdir(), `dsl-${id}.mid`);
  const cleanup = () => Promise.all([unlink(src).catch(() => {}), unlink(out).catch(() => {})]);

  try {
    await writeFile(src, source, 'utf8');

    const { error, stderr } = await runCompiler(environment.compiler_binary, src);

    if (error) {
      const errorCode = (error as NodeJS.ErrnoException).code;

      if (errorCode === 'ENOENT') {
        return infrastructureError('COMPILER_BINARY_NOT_FOUND', 'compiler binary not found');
      }

      if (typeof errorCode === 'string') {
        return infrastructureError('COMPILER_EXECUTION_FAILED', 'compiler process failed to start');
      }

      return parseCompilerDiagnostics(stderr);
    }

    const midi = await readFile(out).catch(() => null);
    if (!midi) {
      return infrastructureError('COMPILER_OUTPUT_MISSING', 'output file not generated');
    }

    return { kind: 'success', midi };
  } catch {
    return infrastructureError(
      'COMPILER_IO_ERROR',
      'compiler input or output could not be processed',
    );
  } finally {
    await cleanup();
  }
}
