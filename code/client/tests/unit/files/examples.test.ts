import { describe, expect, it } from 'vitest';

import { listExampleFiles, readExampleSource } from '@/features/examples/example-files';

describe('bundled Motivo examples contract', () => {
  it('discovers read-only examples from the sources folder', async () => {
    const examples = listExampleFiles();

    expect(examples.length).toBeGreaterThanOrEqual(4);
    expect(examples.every((example) => example.readOnly)).toBe(true);
    expect(examples.every((example) => example.kind === 'example')).toBe(true);
    expect(new Set(examples.map((example) => example.id)).size).toBe(examples.length);
    expect(examples.map((example) => example.order)).toEqual(
      [...examples].sort((left, right) => left.order - right.order).map((example) => example.order),
    );
  });

  it('loads bundled example source without calling the backend', async () => {
    await expect(readExampleSource('example')).resolves.toContain('track');
  });

  it('rejects unknown example IDs', async () => {
    await expect(readExampleSource('missing')).rejects.toThrow('Unknown Motivo example');
  });
});
