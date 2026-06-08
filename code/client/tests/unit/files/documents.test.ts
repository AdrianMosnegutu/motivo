import { describe, expect, it } from 'vitest';

import {
  sortUserFiles,
  upsertUserFileSummary,
} from '@/features/files/lib/documents';
import type { UserFile, UserFileSummary } from '@/features/files/types';

function makeFile(overrides: Partial<UserFile> & Pick<UserFile, 'id' | 'name'>): UserFile {
  return {
    kind: 'user',
    readOnly: false,
    source: 'track main;',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    lastOpenedAt: null,
    ...overrides,
  };
}

function makeSummary(file: UserFile): UserFileSummary {
  const { source: _source, ...summary } = file;
  return summary;
}

describe('user file workspace ordering', () => {
  it('sorts files alphabetically by name', () => {
    const files = [
      makeSummary(makeFile({ id: '2', name: 'zebra.motivo' })),
      makeSummary(makeFile({ id: '1', name: 'alpha.motivo' })),
    ];

    expect(sortUserFiles(files).map((file) => file.name)).toEqual(['alpha.motivo', 'zebra.motivo']);
  });

  it('keeps file position when saving without a rename', () => {
    const initial = sortUserFiles([
      makeSummary(makeFile({ id: 'a', name: 'alpha.motivo', updatedAt: '2026-01-01T00:00:00.000Z' })),
      makeSummary(makeFile({ id: 'b', name: 'beta.motivo', updatedAt: '2026-01-03T00:00:00.000Z' })),
    ]);

    const saved = upsertUserFileSummary(
      initial,
      makeFile({
        id: 'a',
        name: 'alpha.motivo',
        source: 'track updated;',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
    );

    expect(saved.map((file) => file.id)).toEqual(['a', 'b']);
  });

  it('moves a file when it is renamed', () => {
    const initial = sortUserFiles([
      makeSummary(makeFile({ id: 'a', name: 'alpha.motivo' })),
      makeSummary(makeFile({ id: 'b', name: 'beta.motivo' })),
    ]);

    const renamed = upsertUserFileSummary(
      initial,
      makeFile({ id: 'a', name: 'omega.motivo' }),
    );

    expect(renamed.map((file) => file.name)).toEqual(['beta.motivo', 'omega.motivo']);
  });
});
