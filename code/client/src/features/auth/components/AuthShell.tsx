'use client';

import { type FormEvent, useId, useState } from 'react';
import { LogIn, LogOut, UserRound, X } from 'lucide-react';

import Spinner from '@/shared/components/Spinner';

import { getAuthErrorMessage } from '../auth-api';
import { useAuth } from '../AuthContext';

type AuthMode = 'login' | 'register';

function modeLabel(mode: AuthMode) {
  return mode === 'login' ? 'Sign in' : 'Create account';
}

export default function AuthShell() {
  const emailId = useId();
  const passwordId = useId();
  const { clearError, lastError, login, logout, status, user, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    clearError();

    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'login') {
        await login(credentials);
      } else {
        await register(credentials);
      }
      setOpen(false);
      setPassword('');
      setFormError(null);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    setFormError(null);
    clearError();

    try {
      await logout();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  const visibleError = formError ?? lastError;

  if (user) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="hidden sm:flex items-center gap-2 min-w-0 h-8 px-2 rounded-md border border-border bg-background text-xs">
          <UserRound className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
          <span className="max-w-48 truncate" title={user.email}>
            {user.email}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-800"
          aria-label="Sign out"
          title="Sign out"
        >
          {signingOut ? <Spinner /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-expanded={open}
      >
        {status === 'loading' ? <Spinner /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
        <span>Sign in</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Authentication"
          className="absolute right-0 top-full z-20 mt-2 w-[min(20rem,calc(100vw-1rem))] rounded-md border border-border bg-background p-3 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-md border border-border bg-toolbar p-0.5">
              {(['login', 'register'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectMode(item)}
                  className={`h-7 rounded px-2.5 text-xs transition-colors ${
                    mode === item
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-zinc-500 hover:text-foreground'
                  }`}
                  aria-pressed={mode === item}
                >
                  {modeLabel(item)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
              aria-label="Close auth panel"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor={emailId} className="block text-xs text-zinc-500">
                Email
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="h-9 w-full rounded-md border border-border bg-toolbar px-2.5 text-sm text-foreground outline-none transition-colors focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={passwordId} className="block text-xs text-zinc-500">
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                className="h-9 w-full rounded-md border border-border bg-toolbar px-2.5 text-sm text-foreground outline-none transition-colors focus:border-zinc-500"
              />
            </div>

            {visibleError ? (
              <p role="alert" className="text-xs leading-5 text-red-500">
                {visibleError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              aria-label={mode === 'login' ? 'Submit sign in' : 'Submit registration'}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Spinner /> : null}
              {submitting ? 'Working...' : modeLabel(mode)}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
