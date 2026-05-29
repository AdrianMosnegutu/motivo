import comeAsYouAreSource from './sources/come_as_you_are.motivo?raw';
import exampleSource from './sources/example.motivo?raw';
import furEliseSource from './sources/fur_elise.motivo?raw';
import piratesSource from './sources/pirates.motivo?raw';

interface ExampleBundleEntry {
  id: string;
  displayName: string;
  fileName: string;
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
  order: number;
  readOnly: true;
}

export interface ExampleFile extends ExampleFileSummary {
  source: string;
}

const exampleBundle: { examples: ExampleBundleEntry[] } = {
  examples: [
    {
      id: 'come-as-you-are',
      displayName: 'Come As You Are',
      fileName: 'come_as_you_are.motivo',
      order: 0,
      readOnly: true,
      source: comeAsYouAreSource,
    },
    {
      id: 'example',
      displayName: 'Example',
      fileName: 'example.motivo',
      order: 1,
      readOnly: true,
      source: exampleSource,
    },
    {
      id: 'fur-elise',
      displayName: 'Fur Elise',
      fileName: 'fur_elise.motivo',
      order: 2,
      readOnly: true,
      source: furEliseSource,
    },
    {
      id: 'pirates',
      displayName: 'Pirates',
      fileName: 'pirates.motivo',
      order: 3,
      readOnly: true,
      source: piratesSource,
    },
  ],
};

const bundledExamples = exampleBundle.examples
  .slice()
  .sort((left, right) => left.order - right.order)
  .map(
    (example): ExampleFile => ({
      kind: 'example',
      id: example.id,
      name: `${example.displayName}.motivo`,
      displayName: example.displayName,
      fileName: example.fileName,
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
