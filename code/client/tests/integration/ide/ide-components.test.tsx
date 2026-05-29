import type { ComponentProps, MutableRefObject, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MotivoEditorProps } from '@/features/editor/components/MotivoEditor';
import type { ActiveDocument } from '@/features/files/types';
import EditorPane from '@/features/ide/components/EditorPane';
import LoadingPane from '@/features/ide/components/LoadingPane';
import LogsPanel from '@/features/ide/components/LogsPanel';
import VisualizerPane from '@/features/ide/components/VisualizerPane';

type MockPanelRef = MutableRefObject<{
  collapse: ReturnType<typeof vi.fn>;
  expand: ReturnType<typeof vi.fn>;
} | null>;
type EditorComponent = ComponentProps<typeof EditorPane>['MotivoEditor'];

const scratchDocument: ActiveDocument = {
  kind: 'scratch',
  id: 'scratch',
  name: 'unsaved',
  source: 'tempo 120;',
  readOnly: false,
  persisted: false,
};

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

  it('renders tabs and forwards editor callbacks', () => {
    const onCompile = vi.fn();
    const onEditorChange = vi.fn();
    const MotivoEditor: EditorComponent = ({
      documentId = 'scratch:scratch',
      onChange,
      onCompile: compile,
      value,
    }: MotivoEditorProps) => (
      <button
        onClick={() => {
          onChange?.(documentId, 'tempo 120;');
          compile?.();
        }}
      >
        Mock editor {value}
      </button>
    );

    render(
      <EditorPane
        activeDocument={scratchDocument}
        activeTabKey="scratch:scratch"
        MotivoEditor={MotivoEditor}
        openTabs={[
          {
            key: 'scratch:scratch',
            kind: 'scratch',
            id: 'scratch',
            name: 'unsaved',
            readOnly: false,
            closable: true,
            syncState: 'synced',
          },
        ]}
        editorRef={{ current: null }}
        onCloseTab={vi.fn(async () => true)}
        onDownloadActiveFile={vi.fn()}
        onCompile={onCompile}
        onEditorChange={onEditorChange}
        onFocusTab={vi.fn()}
      />,
    );

    expect(screen.getAllByText('unsaved').length).toBeGreaterThan(0);
    expect(screen.queryByText('scratch')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close unsaved/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mock editor/ }));

    expect(onCompile).toHaveBeenCalledTimes(1);
    expect(onEditorChange).toHaveBeenCalledWith('scratch:scratch', 'tempo 120;');
  });

  it('closes a closable user tab', () => {
    const onCloseTab = vi.fn(async () => true);
    const userDocument: ActiveDocument = {
      kind: 'user',
      id: 'file-1',
      name: 'Song.motivo',
      source: 'tempo 120;',
      createdAt: '2026-05-29T00:00:00.000Z',
      updatedAt: '2026-05-29T00:00:00.000Z',
      lastOpenedAt: null,
      readOnly: false,
      persisted: true,
    };

    render(
      <EditorPane
        activeDocument={userDocument}
        activeTabKey="user:file-1"
        MotivoEditor={() => null}
        openTabs={[
          {
            key: 'user:file-1',
            kind: 'user',
            id: 'file-1',
            name: 'Song.motivo',
            readOnly: false,
            closable: true,
            syncState: 'out-of-sync',
          },
        ]}
        editorRef={{ current: null }}
        onCloseTab={onCloseTab}
        onDownloadActiveFile={vi.fn()}
        onCompile={vi.fn()}
        onEditorChange={vi.fn()}
        onFocusTab={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Song.motivo' }));
    expect(onCloseTab).toHaveBeenCalledWith('user:file-1');
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
