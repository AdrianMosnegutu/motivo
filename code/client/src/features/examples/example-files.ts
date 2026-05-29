import exampleBundle from './example-bundle.json';

interface ExampleBundleEntry {
  id: string;
  displayName: string;
  fileName: string;
  path: string;
  order: number;
  readOnly: boolean;
  source: string;
}

export interface ExampleFileSummary {
  kind: 'example';
  id: string;
  name: string;
  displayName: string;
  fileName: string;
  path: string;
  order: number;
  readOnly: true;
}

export interface ExampleFile extends ExampleFileSummary {
  source: string;
}

const bundledExamples = (exampleBundle as { examples: ExampleBundleEntry[] }).examples
  .slice()
  .sort((left, right) => left.order - right.order)
  .map(
    (example): ExampleFile => ({
      kind: 'example',
      id: example.id,
      name: `${example.displayName}.motivo`,
      displayName: example.displayName,
      fileName: example.fileName,
      path: example.path,
      order: example.order,
      readOnly: true,
      source: example.source,
    }),
  );

export function listExampleFiles(): ExampleFileSummary[] {
  return bundledExamples.map(({ source: _source, ...example }) => example);
}

export function readExampleFile(id: string): ExampleFile {
  const example = bundledExamples.find((item) => item.id === id);

  if (!example) {
    throw new Error(`Unknown Motivo example: ${id}`);
  }

  return { ...example };
}

export async function readExampleSource(id: string): Promise<string> {
  return readExampleFile(id).source;
}
