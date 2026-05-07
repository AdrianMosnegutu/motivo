import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DslEditor, { type DslEditorHandle } from '@/features/editor/components/DslEditor';

let currentTheme = 'dark';
const setTheme = vi.fn();
const setModelMarkers = vi.fn();
const setMonacoTheme = vi.fn();
const addAction = vi.fn();
const setPosition = vi.fn();
const revealPositionInCenter = vi.fn();
const focus = vi.fn();
const getValue = vi.fn(() => 'tempo 120;');
const getModel = vi.fn(() => ({ id: 'model' }));

const monacoMock = {
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
  editor: {
    defineTheme: vi.fn(),
    setTheme: setMonacoTheme,
    setModelMarkers,
  },
  KeyMod: { CtrlCmd: 1 },
  KeyCode: { Enter: 2 },
  MarkerSeverity: { Error: 8 },
};

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ beforeMount, onMount, onChange, theme, defaultValue }: any) => {
    beforeMount(monacoMock);
    onMount(
      {
        addAction,
        getModel,
        getValue,
        setPosition,
        revealPositionInCenter,
        focus,
      },
      monacoMock,
    );
    onChange('new source');
    return <div data-theme={theme}>{defaultValue}</div>;
  },
}));

describe('DslEditor', () => {
  it('configures Monaco and exposes editor actions', () => {
    const onChange = vi.fn();
    const onCompile = vi.fn();
    const ref = { current: null as DslEditorHandle | null };

    render(<DslEditor ref={ref} onChange={onChange} onCompile={onCompile} />);

    expect(screen.getByText(/tempo 120/)).toBeInTheDocument();
    expect(monacoMock.languages.register).toHaveBeenCalled();
    expect(monacoMock.editor.defineTheme).toHaveBeenCalled();
    expect(addAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'dsl.compile' }));
    expect(onChange).toHaveBeenCalledWith('new source');

    ref.current?.jumpTo(2, 3);
    expect(setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 3 });

    ref.current?.setError(4, 5, 'bad');
    expect(setModelMarkers).toHaveBeenCalledWith({ id: 'model' }, 'dsl', [
      expect.objectContaining({ startLineNumber: 4, startColumn: 5 }),
    ]);

    ref.current?.clearError();
    expect(setModelMarkers).toHaveBeenCalledWith({ id: 'model' }, 'dsl', []);
  });

  it('applies the light editor theme', () => {
    currentTheme = 'light';
    render(<DslEditor />);
    expect(screen.getByText(/tempo 120/)).toHaveAttribute('data-theme', 'dsl-light');
  });
});
