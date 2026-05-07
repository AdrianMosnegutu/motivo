import type { ComponentProps, MutableRefObject, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DslEditorProps } from '@/features/editor/components/DslEditor';
import EditorPane from '@/features/ide/components/EditorPane';
import LoadingPane from '@/features/ide/components/LoadingPane';
import LogsPanel from '@/features/ide/components/LogsPanel';
import VisualizerPane from '@/features/ide/components/VisualizerPane';

type MockPanelRef = MutableRefObject<{
  collapse: ReturnType<typeof vi.fn>;
  expand: ReturnType<typeof vi.fn>;
} | null>;
type EditorComponent = ComponentProps<typeof EditorPane>['DslEditor'];

vi.mock('react-resizable-panels', () => ({
  Panel: ({
    children,
    className,
    panelRef,
  }: {
    children: ReactNode;
    className?: string;
    panelRef?: MockPanelRef;
  }) => {
    if (panelRef) panelRef.current = { collapse: vi.fn(), expand: vi.fn() };
    return (
      <section data-testid="panel" className={className}>
        {children}
      </section>
    );
  },
}));

vi.mock('@/features/playback/components/PlaybackBar', () => ({
  default: () => <div>PlaybackBar</div>,
}));

describe('IDE shell components', () => {
  it('renders loading labels', () => {
    render(<LoadingPane label="Loading editor..." className="custom" />);
    expect(screen.getByText('Loading editor...')).toHaveClass('custom');
  });

  it('renders editor controls and forwards editor callbacks', () => {
    const onCompile = vi.fn();
    const onEditorChange = vi.fn();
    const DslEditor: EditorComponent = ({ onChange, onCompile: compile }: DslEditorProps) => (
      <button
        onClick={() => {
          onChange?.('tempo 120;');
          compile?.();
        }}
      >
        Mock editor
      </button>
    );

    render(
      <EditorPane
        DslEditor={DslEditor}
        editorRef={{ current: null }}
        compiling={false}
        onCompile={onCompile}
        onEditorChange={onEditorChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Compile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock editor' }));

    expect(onCompile).toHaveBeenCalledTimes(2);
    expect(onEditorChange).toHaveBeenCalledWith('tempo 120;');
  });

  it('renders compiling state', () => {
    render(
      <EditorPane
        DslEditor={() => null}
        editorRef={{ current: null }}
        compiling
        onCompile={vi.fn()}
        onEditorChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Compiling/ })).toBeDisabled();
  });

  it('clears logs from the logs panel', () => {
    const setLog = vi.fn();

    render(
      <LogsPanel
        panelRef={{ current: null }}
        setLog={setLog}
        onJump={vi.fn()}
        log={{ kind: 'success', timestamp: new Date() }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(setLog).toHaveBeenCalledWith(null);
  });

  it('composes playback and piano roll panes', () => {
    render(<VisualizerPane PianoRoll={() => <div>PianoRoll</div>} />);

    expect(screen.getByText('PlaybackBar')).toBeInTheDocument();
    expect(screen.getByText('PianoRoll')).toBeInTheDocument();
  });
});
