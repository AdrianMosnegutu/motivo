import { describe, expect, it } from 'vitest';

import { listExampleFiles, readExampleSource } from '@/features/examples/example-files';

describe('bundled Motivo examples contract', () => {
  it('exposes read-only examples with stable metadata', async () => {
    const examples = listExampleFiles();

    expect(examples.map((example) => example.id)).toEqual([
      'come-as-you-are',
      'example',
      'fur-elise',
      'pirates',
    ]);
    expect(examples.every((example) => example.readOnly)).toBe(true);
    expect(examples.every((example) => example.kind === 'example')).toBe(true);
  });

  it('loads bundled example source without calling the backend', async () => {
    await expect(readExampleSource('example')).resolves.toContain('track');
  });

  it('rejects unknown example IDs', async () => {
    await expect(readExampleSource('missing')).rejects.toThrow('Unknown Motivo example');
  });
});
