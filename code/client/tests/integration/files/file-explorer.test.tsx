import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FileExplorer from '@/features/files/components/FileExplorer';
import type { ActiveDocument, ExampleFileSummary, UserFileSummary } from '@/features/files/types';

const scratchDocument: ActiveDocument = {
  kind: 'scratch',
  id: 'scratch',
  name: 'Scratch.motivo',
  source: 'tempo 120;',
  readOnly: false,
  persisted: false,
};

const examples: ExampleFileSummary[] = [
  {
    kind: 'example',
    id: 'example',
    name: 'Example.motivo',
    order: 10,
    readOnly: true,
  },
];

const userFiles: UserFileSummary[] = [
  {
    kind: 'user',
    id: 'file-1',
    name: 'Song.motivo',
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    lastOpenedAt: null,
    readOnly: false,
  },
];

function renderExplorer(overrides: Partial<ComponentProps<typeof FileExplorer>> = {}) {
  const props: ComponentProps<typeof FileExplorer> = {
    activeDocument: scratchDocument,
    authLoading: false,
    authenticated: false,
    examples,
    filesLoading: false,
    operationError: null,
    userFiles: [],
    onCreateFile: vi.fn(async () => true),
    onDeleteFile: vi.fn(async () => true),
    onDownloadFile: vi.fn(async () => true),
    onOpenExample: vi.fn(),
    onOpenScratch: vi.fn(),
    onOpenUserFile: vi.fn(async () => true),
    onRefresh: vi.fn(),
    onRenameFile: vi.fn(async () => true),
    ...overrides,
  };

  render(<FileExplorer {...props} />);
  return props;
}

describe('FileExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
  });

  it('shows scratch and read-only examples for unauthenticated users', () => {
    const props = renderExplorer();

    expect(screen.getByText('Scratch.motivo')).toBeInTheDocument();
    expect(screen.getByText('Sign in to save files.')).toBeInTheDocument();
    expect(screen.getByText('Example.motivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New file' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Example.motivo read-only' }));
    expect(props.onOpenExample).toHaveBeenCalledWith('example');
  });

  it('creates, renames, downloads, deletes, and opens user files when authenticated', async () => {
    const props = renderExplorer({ authenticated: true, userFiles });

    fireEvent.click(screen.getByRole('button', { name: 'New file' }));
    fireEvent.change(screen.getByPlaceholderText('New file name'), {
      target: { value: 'New Song' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create file' }));
    expect(props.onCreateFile).toHaveBeenCalledWith('New Song');

    fireEvent.click(screen.getByRole('button', { name: 'Song.motivo' }));
    expect(props.onOpenUserFile).toHaveBeenCalledWith('file-1');

    fireEvent.click(screen.getByRole('button', { name: 'Rename Song.motivo' }));
    fireEvent.change(screen.getByDisplayValue('Song.motivo'), {
      target: { value: 'Renamed Song' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Song.motivo' }));
    expect(props.onRenameFile).toHaveBeenCalledWith('file-1', 'Renamed Song');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Download Song.motivo' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download Song.motivo' }));
    expect(props.onDownloadFile).toHaveBeenCalledWith('file-1');

    fireEvent.click(screen.getByRole('button', { name: 'Delete Song.motivo' }));
    expect(props.onDeleteFile).toHaveBeenCalledWith('file-1');
  });

  it('surfaces file operation errors', () => {
    renderExplorer({
      authenticated: true,
      operationError: 'A file with that name already exists.',
    });

    expect(screen.getByRole('alert')).toHaveTextContent('A file with that name already exists.');
  });
});
