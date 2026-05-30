declare module '*.motivo?raw' {
  const source: string;
  export default source;
}

interface ImportMeta {
  glob<T = Record<string, () => Promise<T>>>(
    pattern: string,
    options?: {
      eager?: boolean;
      query?: string;
      import?: string;
    },
  ): Record<string, T>;
}

interface RequireContext {
  keys(): string[];
  <T = string>(id: string): T;
}

declare namespace NodeRequire {
  interface Require {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp,
      mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once',
    ): RequireContext;
  }
}

declare const require: NodeRequire.Require;
