import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MotivoEditor, {
  type MotivoEditorHandle,
  type MotivoEditorProps,
} from '@/features/editor/components/MotivoEditor';

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

vi.mock('@monaco-editor/react', () => ({
  default: ({
    beforeMount,
    onMount,
    onChange,
    theme,
    options,
    value,
  }: {
    beforeMount: (monaco: typeof monacoMock) => void;
    onMount: (editor: unknown, monaco: typeof monacoMock) => void;
    onChange?: (value: string | undefined) => void;
    options: { readOnly?: boolean };
    theme: string;
    value: string;
  }) => {
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
    onChange?.('new source');
    return (
      <div data-readonly={String(Boolean(options.readOnly))} data-theme={theme}>
        {value}
      </div>
    );
  },
}));

describe('MotivoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures Monaco and exposes editor actions', () => {
    const onChange = vi.fn();
    const onCompile = vi.fn();
    const ref = { current: null as MotivoEditorHandle | null };

    render(<MotivoEditor ref={ref} onChange={onChange} onCompile={onCompile} />);

    expect(screen.getByText(/tempo 120/)).toBeInTheDocument();
    expect(monacoMock.languages.register).toHaveBeenCalled();
    expect(monacoMock.editor.defineTheme).toHaveBeenCalled();
    expect(addAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'motivo.compile' }));
    expect(onChange).toHaveBeenCalledWith('scratch:scratch', 'new source');
    expect(localStorage.setItem).not.toHaveBeenCalled();

    ref.current?.jumpTo(2, 3);
    expect(setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 3 });

    ref.current?.setError(4, 5, 'bad');
    expect(setModelMarkers).toHaveBeenCalledWith({ id: 'model' }, 'motivo', [
      expect.objectContaining({ startLineNumber: 4, startColumn: 5 }),
    ]);

    ref.current?.clearError();
    expect(setModelMarkers).toHaveBeenCalledWith({ id: 'model' }, 'motivo', []);
  });

  it('applies the dark editor theme', () => {
    render(<MotivoEditor />);
    expect(screen.getByText(/tempo 120/)).toHaveAttribute('data-theme', 'motivo-dark');
  });

  it('uses the active document source and blocks edits in read-only mode', () => {
    const onChange = vi.fn();

    render(<MotivoEditor value="tempo 144;" readOnly onChange={onChange} />);

    expect(screen.getByText('tempo 144;')).toHaveAttribute('data-readonly', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });
});
