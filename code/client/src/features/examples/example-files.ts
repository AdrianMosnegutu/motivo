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

interface ExampleSourceContext {
  keys(): string[];
  read(path: string): string;
}

function createExampleSourceContext(): ExampleSourceContext {
  if (process.env.VITEST === 'true') {
    const modules = import.meta.glob<string>('./sources/*.motivo', {
      eager: true,
      query: '?raw',
      import: 'default',
    });

    return {
      keys: () =>
        Object.keys(modules).map((path) => {
          const fileName = path.split('/').pop() ?? path;
          return `./${fileName}`;
        }),
      read(path: string) {
        const fileName = path.replace(/^\.\//, '');
        const modulePath = `./sources/${fileName}`;
        const source = modules[modulePath];

        if (typeof source !== 'string') {
          throw new Error(`Missing Motivo example source: ${fileName}`);
        }

        return source;
      },
    };
  }

  const context = require.context('./sources', false, /\.motivo$/);

  return {
    keys: () => context.keys(),
    read: (path: string) => context(path) as string,
  };
}

const exampleSourceContext = createExampleSourceContext();

function fileNameFromPath(path: string): string {
  return path.replace(/^\.\//, '');
}

function fileNameToId(fileName: string): string {
  return fileName
    .replace(/\.motivo$/i, '')
    .replace(/_/g, '-')
    .toLowerCase();
}

function fileNameToDisplayName(fileName: string): string {
  const base = fileName.replace(/\.motivo$/i, '').replace(/^\d+_/, '');

  return base
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function fileNameToSortKey(fileName: string): [number, string] {
  const orderMatch = fileName.match(/^(\d+)_/);
  const order = orderMatch ? Number.parseInt(orderMatch[1], 10) : Number.MAX_SAFE_INTEGER;

  return [order, fileName];
}

function buildBundledExamples(): ExampleFile[] {
  return exampleSourceContext
    .keys()
    .map((path) => {
      const fileName = fileNameFromPath(path);
      const displayName = fileNameToDisplayName(fileName);
      const source = exampleSourceContext.read(path);

      return {
        kind: 'example' as const,
        id: fileNameToId(fileName),
        name: `${displayName}.motivo`,
        displayName,
        fileName,
        order: 0,
        readOnly: true as const,
        source,
      };
    })
    .sort((left, right) => {
      const [leftOrder, leftName] = fileNameToSortKey(left.fileName);
      const [rightOrder, rightName] = fileNameToSortKey(right.fileName);

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return leftName.localeCompare(rightName);
    })
    .map((example, index) => ({ ...example, order: index }));
}

const bundledExamples = buildBundledExamples();

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
