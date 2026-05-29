import { useCallback, useEffect, useRef, useState } from 'react';

import type { AutosaveStatus } from '../types';

export const AUTOSAVE_DEBOUNCE_MS = 500;

interface UseDebouncedAutosaveOptions {
  fileId: string | null;
  readOnly: boolean;
  authenticated: boolean;
  save: (fileId: string, source: string) => Promise<void>;
  debounceMs?: number;
  onError?: (error: unknown) => void;
  onSaved?: () => void;
}

export function useDebouncedAutosave({
  fileId,
  readOnly,
  authenticated,
  save,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
  onError,
  onSaved,
}: UseDebouncedAutosaveOptions) {
  const activeKey = `${authenticated}:${fileId ?? 'none'}:${readOnly}`;
  const [state, setState] = useState<{
    error: unknown;
    key: string;
    status: AutosaveStatus;
  }>({ error: null, key: activeKey, status: 'idle' });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSourceRef = useRef('');
  const versionRef = useRef(0);
  const mountedRef = useRef(true);
  const delay = Math.max(debounceMs, AUTOSAVE_DEBOUNCE_MS);

  const clearPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearPendingSave();
    };
  }, [clearPendingSave]);

  useEffect(() => {
    clearPendingSave();
    versionRef.current += 1;
  }, [activeKey, clearPendingSave]);

  const scheduleSave = useCallback(
    (source: string) => {
      if (!authenticated || readOnly || !fileId) return;

      clearPendingSave();
      latestSourceRef.current = source;
      const saveVersion = versionRef.current + 1;
      versionRef.current = saveVersion;
      setState({ error: null, key: activeKey, status: 'pending' });

      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
        if (!mountedRef.current || saveVersion !== versionRef.current) return;

        setState((current) =>
          current.key === activeKey ? { error: null, key: activeKey, status: 'saving' } : current,
        );

        try {
          await save(fileId, latestSourceRef.current);
          if (!mountedRef.current || saveVersion !== versionRef.current) return;
          setState((current) =>
            current.key === activeKey ? { error: null, key: activeKey, status: 'saved' } : current,
          );
          onSaved?.();
        } catch (saveError) {
          if (!mountedRef.current || saveVersion !== versionRef.current) return;
          setState((current) =>
            current.key === activeKey
              ? { error: saveError, key: activeKey, status: 'error' }
              : current,
          );
          onError?.(saveError);
        }
      }, delay);
    },
    [activeKey, authenticated, clearPendingSave, delay, fileId, onError, onSaved, readOnly, save],
  );

  const currentState =
    state.key === activeKey ? state : { error: null, key: activeKey, status: 'idle' as const };

  return {
    error: currentState.error,
    scheduleSave,
    status: currentState.status,
  };
}
