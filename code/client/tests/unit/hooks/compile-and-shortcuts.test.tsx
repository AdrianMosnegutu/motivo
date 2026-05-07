import { act, fireEvent, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCompileMutation } from '@/features/compile/useCompileMutation';
import { useIdeCompile } from '@/features/ide/hooks/useIdeCompile';
import { useLogsPanelShortcut } from '@/features/ide/hooks/useLogsPanelShortcut';
import { usePlaybackShortcut } from '@/features/playback/hooks/usePlaybackShortcut';

const compileSource = vi.fn();
const setMidiBytes = vi.fn();

vi.mock('@/features/compile/compile-client', () => ({
  compileSource: (...args: unknown[]) => compileSource(...args),
}));

vi.mock('@/features/midi/MidiContext', () => ({
  useMidi: () => ({ setMidiBytes }),
}));

describe('compile and shortcut hooks', () => {
  beforeEach(() => {
    compileSource.mockReset();
    setMidiBytes.mockReset();
  });

  it('tracks compile mutation state and returns results', async () => {
    compileSource.mockResolvedValue({ kind: 'success', midiBytes: new Uint8Array([1]) });
    const { result } = renderHook(() => useCompileMutation());

    await act(async () => {
      await expect(result.current.compile('source')).resolves.toEqual({
        kind: 'success',
        midiBytes: new Uint8Array([1]),
      });
    });

    expect(compileSource).toHaveBeenCalledWith('source');
    expect(result.current.compiling).toBe(false);
  });

  it('updates MIDI and editor state after successful IDE compilation', async () => {
    compileSource.mockResolvedValue({ kind: 'success', midiBytes: new Uint8Array([1]) });
    const editorRef = {
      current: {
        blur: vi.fn(),
        clearError: vi.fn(),
        jumpTo: vi.fn(),
        setError: vi.fn(),
      },
    };
    const { result } = renderHook(() => useIdeCompile(editorRef));

    act(() => result.current.handleEditorChange('tempo 120;'));
    await act(async () => result.current.handleCompile());

    expect(setMidiBytes).toHaveBeenCalledWith(null);
    expect(setMidiBytes).toHaveBeenCalledWith(new Uint8Array([1]));
    expect(editorRef.current.blur).toHaveBeenCalled();
    expect(result.current.log?.kind).toBe('success');
  });

  it('highlights the first compiler diagnostic after failed IDE compilation', async () => {
    compileSource.mockResolvedValue({
      kind: 'error',
      diagnostics: [
        {
          severity: 'error',
          type: 'semantic',
          message: 'bad',
          line: 3,
          column: 4,
        },
      ],
    });
    const editorRef = {
      current: {
        blur: vi.fn(),
        clearError: vi.fn(),
        jumpTo: vi.fn(),
        setError: vi.fn(),
      },
    };
    const { result } = renderHook(() => useIdeCompile(editorRef));

    await act(async () => result.current.handleCompile());

    expect(editorRef.current.setError).toHaveBeenCalledWith(3, 4, 'bad');
    expect(editorRef.current.jumpTo).toHaveBeenCalledWith(3, 4);
    expect(result.current.log?.kind).toBe('error');
  });

  it('toggles the logs panel with Cmd/Ctrl+J', () => {
    const collapse = vi.fn();
    const expand = vi.fn();
    const panelRef = {
      current: {
        collapse,
        expand,
        isCollapsed: vi.fn(() => false),
      },
    };

    renderHook(() => useLogsPanelShortcut(panelRef));
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });

    expect(collapse).toHaveBeenCalled();

    panelRef.current.isCollapsed.mockReturnValue(true);
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(expand).toHaveBeenCalled();
  });

  it('toggles playback with the spacebar outside editor inputs', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const { rerender } = renderHook(
      ({ playState }: { playState: 'playing' | 'stopped' }) =>
        usePlaybackShortcut({ playState, onPlay, onPause }),
      { initialProps: { playState: 'stopped' } },
    );

    fireEvent.keyDown(window, { code: 'Space' });
    expect(onPlay).toHaveBeenCalled();

    rerender({ playState: 'playing' });
    fireEvent.keyDown(window, { code: 'Space' });
    expect(onPause).toHaveBeenCalled();
  });
});
