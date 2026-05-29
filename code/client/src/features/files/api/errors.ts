interface ApiErrorBody {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
}

export class FileApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'FileApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

export async function createFileApiError(
  response: Response,
  fallbackMessage: string,
): Promise<FileApiError> {
  const body = await readErrorBody(response);
  const error = body?.error;
  const code = typeof error?.code === 'string' ? error.code : `HTTP_${response.status}`;
  const message = typeof error?.message === 'string' ? error.message : fallbackMessage;

  return new FileApiError(message, code, response.status, error?.details);
}

export function getFileErrorMessage(error: unknown): string {
  if (error instanceof FileApiError) {
    if (error.code === 'FILE_NAME_CONFLICT') {
      return 'A file with that name already exists.';
    }

    if (error.code === 'UNAUTHENTICATED' || error.status === 401) {
      return 'Sign in to manage saved files.';
    }

    if (error.code === 'FILE_NOT_FOUND' || error.status === 404) {
      return 'The selected file could not be found.';
    }

    return error.message;
  }

  return 'File operation failed.';
}
