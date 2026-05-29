import { API_ROUTES } from '@/config/app';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedFileId: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthUserResponse {
  user: AuthUser | null;
}

interface ApiErrorBody {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
}

export class AuthApiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toAuthApiError(response: Response, payload: unknown) {
  const body = payload as ApiErrorBody | null;
  const code = typeof body?.error?.code === 'string' ? body.error.code : 'AUTH_REQUEST_FAILED';
  const message =
    typeof body?.error?.message === 'string' ? body.error.message : 'Authentication request failed';

  return new AuthApiError(response.status, code, message, body?.error?.details);
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new AuthApiError(
        response.status,
        'AUTH_REQUEST_FAILED',
        'Authentication request failed',
      );
    }

    return undefined as T;
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw toAuthApiError(response, payload);
  }

  return payload as T;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await requestJson<AuthUserResponse>(API_ROUTES.auth.me);
  return payload.user;
}

export async function loginUser(credentials: AuthCredentials): Promise<AuthUser> {
  const payload = await requestJson<AuthUserResponse>(API_ROUTES.auth.login, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (!payload.user) {
    throw new AuthApiError(200, 'AUTH_USER_MISSING', 'Authentication response was missing a user');
  }

  return payload.user;
}

export async function registerUser(credentials: AuthCredentials): Promise<AuthUser> {
  const payload = await requestJson<AuthUserResponse>(API_ROUTES.auth.register, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (!payload.user) {
    throw new AuthApiError(201, 'AUTH_USER_MISSING', 'Authentication response was missing a user');
  }

  return payload.user;
}

export async function logoutUser(): Promise<void> {
  await requestJson<void>(API_ROUTES.auth.logout, { method: 'POST' });
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  return 'Unable to reach the auth service';
}
