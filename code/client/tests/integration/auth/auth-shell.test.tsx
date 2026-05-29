import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_ROUTES } from '@/config/app';
import type { AuthUser } from '@/features/auth/auth-api';
import { AuthProvider } from '@/features/auth/AuthContext';
import AuthShell from '@/features/auth/components/AuthShell';

const authUser: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  createdAt: '2026-05-29T07:00:00.000Z',
  updatedAt: '2026-05-29T07:00:00.000Z',
  lastOpenedFileId: null,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAuth(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('auth shell', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not block unauthenticated editor access while the session loads', () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    renderAuth(
      <>
        <AuthShell />
        <div>Scratch editor</div>
      </>,
    );

    expect(screen.getByText('Scratch editor')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      API_ROUTES.auth.me,
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('logs in and logs out with cookie-backed auth requests', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === API_ROUTES.auth.me) {
        return Promise.resolve(jsonResponse({ user: null }));
      }

      if (url === API_ROUTES.auth.login) {
        expect(init?.method).toBe('POST');
        expect(init?.credentials).toBe('include');
        expect(JSON.parse(String(init?.body))).toEqual({
          email: authUser.email,
          password: 'password123',
        });

        return Promise.resolve(jsonResponse({ user: authUser }));
      }

      if (url === API_ROUTES.auth.logout) {
        expect(init?.method).toBe('POST');
        expect(init?.credentials).toBe('include');
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      return Promise.reject(new Error(`Unexpected auth request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAuth(
      <>
        <AuthShell />
        <div>Scratch editor</div>
      </>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));

    const dialog = screen.getByRole('dialog', { name: 'Authentication' });
    fireEvent.change(within(dialog).getByLabelText('Email'), {
      target: { value: authUser.email },
    });
    fireEvent.change(within(dialog).getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit sign in' }));

    await waitFor(() => expect(screen.getByText(authUser.email)).toBeInTheDocument());
    expect(screen.getByText('Scratch editor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument(),
    );
  });

  it('surfaces register errors from the auth API', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === API_ROUTES.auth.me) {
        return Promise.resolve(jsonResponse({ user: null }));
      }

      if (url === API_ROUTES.auth.register) {
        return Promise.resolve(
          jsonResponse(
            {
              error: {
                code: 'EMAIL_ALREADY_REGISTERED',
                message: 'Email already registered',
              },
            },
            409,
          ),
        );
      }

      return Promise.reject(new Error(`Unexpected auth request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAuth(<AuthShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));

    const dialog = screen.getByRole('dialog', { name: 'Authentication' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create account' }));
    fireEvent.change(within(dialog).getByLabelText('Email'), {
      target: { value: authUser.email },
    });
    fireEvent.change(within(dialog).getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit registration' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Email already registered');
  });
});
