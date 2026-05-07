import axios, { type AxiosInstance } from 'axios';

import { API_ROUTES } from '@/config/app';

import { createInternalDiagnostic, NETWORK_ERROR_DIAGNOSTIC } from './diagnostics';
import type { CompileResult, Diagnostic } from './types';

type CompileHttpClient = Pick<AxiosInstance, 'post'>;

function isDiagnostic(value: unknown): value is Diagnostic {
  if (!value || typeof value !== 'object') return false;
  const diagnostic = value as Partial<Diagnostic>;
  return (
    typeof diagnostic.type === 'string' &&
    typeof diagnostic.severity === 'string' &&
    typeof diagnostic.message === 'string'
  );
}

function readDiagnostics(payload: unknown): Diagnostic[] | null {
  if (!payload || typeof payload !== 'object') return null;

  const body = payload as {
    diagnostics?: unknown;
    error?: { diagnostics?: unknown; message?: unknown; code?: unknown };
  };

  if (Array.isArray(body.diagnostics) && body.diagnostics.every(isDiagnostic)) {
    return body.diagnostics;
  }

  if (Array.isArray(body.error?.diagnostics) && body.error.diagnostics.every(isDiagnostic)) {
    return body.error.diagnostics;
  }

  if (typeof body.error?.message === 'string') {
    return [createInternalDiagnostic(body.error.message)];
  }

  return null;
}

async function parseJsonPayload(payload: unknown) {
  if (isArrayBuffer(payload)) {
    try {
      const text = new TextDecoder().decode(payload);
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  return payload;
}

function isArrayBuffer(payload: unknown): payload is ArrayBuffer {
  return (
    payload instanceof ArrayBuffer ||
    Object.prototype.toString.call(payload) === '[object ArrayBuffer]'
  );
}

export async function compileSource(
  source: string,
  httpClient: CompileHttpClient = axios,
): Promise<CompileResult> {
  try {
    const response = await httpClient.post(
      API_ROUTES.compile,
      { source },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
        validateStatus: () => true,
      },
    );

    if (response.status >= 200 && response.status < 300) {
      return { kind: 'success', midiBytes: new Uint8Array(response.data as ArrayBuffer) };
    }

    const payload = await parseJsonPayload(response.data);
    const diagnostics = readDiagnostics(payload) ?? [
      createInternalDiagnostic('Compilation failed'),
    ];

    return { kind: 'error', diagnostics };
  } catch {
    return { kind: 'error', diagnostics: [NETWORK_ERROR_DIAGNOSTIC] };
  }
}
