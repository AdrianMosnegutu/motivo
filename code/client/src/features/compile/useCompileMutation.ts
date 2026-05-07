'use client';

import { useCallback, useState } from 'react';

import { compileSource } from './compile-client';

export function useCompileMutation() {
  const [compiling, setCompiling] = useState(false);

  const compile = useCallback(
    async (source: string) => {
      if (compiling) return null;

      setCompiling(true);
      try {
        return await compileSource(source);
      } finally {
        setCompiling(false);
      }
    },
    [compiling],
  );

  return { compile, compiling };
}
