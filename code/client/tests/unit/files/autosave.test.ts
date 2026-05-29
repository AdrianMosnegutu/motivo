import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedAutosave } from '@/features/files/hooks/useDebouncedAutosave';

describe('useDebouncedAutosave contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('debounces rapid edits into one save request', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedAutosave({ fileId: 'file-1', readOnly: false, authenticated: true, save }),
    );

    act(() => {
      result.current.scheduleSave('a');
      result.current.scheduleSave('ab');
      result.current.scheduleSave('abc');
    });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe('pending');

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('file-1', 'abc');
    expect(result.current.status).toBe('saved');
  });

  it('does not autosave read-only examples or unauthenticated scratch documents', () => {
    const save = vi.fn();
    const readonlyHook = renderHook(() =>
      useDebouncedAutosave({ fileId: 'example-1', readOnly: true, authenticated: true, save }),
    );
    const anonymousHook = renderHook(() =>
      useDebouncedAutosave({ fileId: null, readOnly: false, authenticated: false, save }),
    );

    act(() => {
      readonlyHook.result.current.scheduleSave('example change');
      anonymousHook.result.current.scheduleSave('scratch change');
      vi.advanceTimersByTime(1000);
    });

    expect(save).not.toHaveBeenCalled();
    expect(readonlyHook.result.current.status).toBe('idle');
    expect(anonymousHook.result.current.status).toBe('idle');
  });
});
