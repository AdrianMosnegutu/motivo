import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import { DEFAULT_MOTIVO_SNIPPET } from '@/features/editor/monaco/monaco-config';
import { listExampleFiles, readExampleFile } from '@/features/examples/example-files';

import { getFileErrorMessage } from '../api/errors';
import {
  createFile,
  deleteFile as deleteRemoteFile,
  downloadFile,
  listFiles,
  readFile,
  updateFile,
} from '../api/file-client';
import {
  createScratchDocument,
  ensureMotivoFileName,
  toExampleDocument,
  toUserDocument,
  upsertUserFileSummary,
} from '../lib/documents';
import { downloadBlob } from '../lib/download-source';
import type { ActiveDocument, UserFileSummary } from '../types';

import { useDebouncedAutosave } from './useDebouncedAutosave';

function replaceActiveUserMetadata(document: ActiveDocument, fileId: string, fileName: string) {
  if (document.kind !== 'user' || document.id !== fileId) return document;
  return {
    ...document,
    name: fileName,
  };
}

export function useFileWorkspace() {
  const { isAuthenticated, refresh: refreshAuth, status: authStatus, user } = useAuth();
  const examples = useMemo(() => listExampleFiles(), []);
  const [filesLoading, setFilesLoading] = useState(false);
  const [userFiles, setUserFiles] = useState<UserFileSummary[]>([]);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [scratchSource, setScratchSource] = useState(DEFAULT_MOTIVO_SNIPPET);
  const [activeDocument, setActiveDocument] = useState<ActiveDocument>(() =>
    createScratchDocument(),
  );
  const activeDocumentRef = useRef(activeDocument);
  const scratchSourceRef = useRef(scratchSource);

  const authenticated = isAuthenticated;
  const authLoading = authStatus === 'loading';

  useEffect(() => {
    activeDocumentRef.current = activeDocument;
  }, [activeDocument]);

  useEffect(() => {
    scratchSourceRef.current = scratchSource;
  }, [scratchSource]);

  const loadUserFiles = useCallback(async (preferredFileId?: string | null) => {
    setFilesLoading(true);
    setOperationError(null);

    try {
      const files = await listFiles();
      setUserFiles(files);

      if (preferredFileId && files.some((file) => file.id === preferredFileId)) {
        const file = await readFile(preferredFileId);
        setActiveDocument(toUserDocument(file));
      }
    } catch (error) {
      setOperationError(getFileErrorMessage(error));
    } finally {
      setFilesLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setOperationError(null);

    const nextUser = await refreshAuth();

    if (nextUser) {
      await loadUserFiles(nextUser.lastOpenedFileId);
    } else {
      setUserFiles([]);
      if (activeDocumentRef.current.kind === 'user') {
        setActiveDocument(createScratchDocument(scratchSourceRef.current));
      }
    }
  }, [loadUserFiles, refreshAuth]);

  useEffect(() => {
    let cancelled = false;

    async function loadFilesForAuthState() {
      await Promise.resolve();
      if (cancelled) return;

      if (authStatus === 'loading') {
        return;
      }

      if (!user) {
        setUserFiles([]);
        if (activeDocumentRef.current.kind === 'user') {
          setActiveDocument(createScratchDocument(scratchSourceRef.current));
        }
        return;
      }

      setFilesLoading(true);
      setOperationError(null);

      try {
        const files = await listFiles();
        if (cancelled) return;
        setUserFiles(files);

        if (user.lastOpenedFileId && files.some((file) => file.id === user.lastOpenedFileId)) {
          const file = await readFile(user.lastOpenedFileId);
          if (cancelled) return;
          setActiveDocument(toUserDocument(file));
        }
      } catch (error) {
        if (!cancelled) setOperationError(getFileErrorMessage(error));
      } finally {
        if (!cancelled) {
          setFilesLoading(false);
        }
      }
    }

    void loadFilesForAuthState();

    return () => {
      cancelled = true;
    };
  }, [authStatus, user]);

  const saveSource = useCallback(async (fileId: string, source: string) => {
    const file = await updateFile(fileId, { source });
    setUserFiles((current) => upsertUserFileSummary(current, file));
    setActiveDocument((current) => {
      if (current.kind !== 'user' || current.id !== file.id) return current;
      return {
        ...current,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        lastOpenedAt: file.lastOpenedAt,
        name: file.name,
      };
    });
  }, []);

  const { scheduleSave, status: autosaveStatus } = useDebouncedAutosave({
    authenticated,
    fileId: activeDocument.kind === 'user' ? activeDocument.id : null,
    readOnly: activeDocument.readOnly,
    save: saveSource,
    onError: (error) => setOperationError(getFileErrorMessage(error)),
  });

  const openScratch = useCallback(() => {
    setOperationError(null);
    setActiveDocument(createScratchDocument(scratchSource));
  }, [scratchSource]);

  const openExample = useCallback((id: string) => {
    try {
      setOperationError(null);
      setActiveDocument(toExampleDocument(readExampleFile(id)));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Example could not be opened.');
    }
  }, []);

  const openUserFile = useCallback(
    async (id: string) => {
      if (!authenticated) {
        setOperationError('Sign in to open saved files.');
        return false;
      }

      setOperationError(null);

      try {
        const file = await readFile(id);
        setActiveDocument(toUserDocument(file));
        setUserFiles((current) => upsertUserFileSummary(current, file));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated],
  );

  const createUserFile = useCallback(
    async (name: string) => {
      if (!authenticated) {
        setOperationError('Sign in to create saved files.');
        return false;
      }

      setOperationError(null);

      try {
        const file = await createFile({
          name: ensureMotivoFileName(name),
          source: DEFAULT_MOTIVO_SNIPPET,
        });
        setUserFiles((current) => upsertUserFileSummary(current, file));
        setActiveDocument(toUserDocument(file));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated],
  );

  const renameUserFile = useCallback(
    async (id: string, name: string) => {
      if (!authenticated) {
        setOperationError('Sign in to rename saved files.');
        return false;
      }

      setOperationError(null);

      try {
        const file = await updateFile(id, { name: ensureMotivoFileName(name) });
        setUserFiles((current) => upsertUserFileSummary(current, file));
        setActiveDocument((current) => replaceActiveUserMetadata(current, file.id, file.name));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated],
  );

  const deleteUserFile = useCallback(
    async (id: string) => {
      if (!authenticated) {
        setOperationError('Sign in to delete saved files.');
        return false;
      }

      setOperationError(null);

      try {
        await deleteRemoteFile(id);
        setUserFiles((current) => current.filter((file) => file.id !== id));
        if (activeDocumentRef.current.kind === 'user' && activeDocumentRef.current.id === id) {
          setActiveDocument(createScratchDocument(scratchSourceRef.current));
        }
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated],
  );

  const downloadUserFile = useCallback(
    async (id: string) => {
      if (!authenticated) {
        setOperationError('Sign in to download saved files.');
        return false;
      }

      const fallbackName = userFiles.find((file) => file.id === id)?.name ?? 'motivo-source.motivo';
      setOperationError(null);

      try {
        const { blob, filename } = await downloadFile(id, fallbackName);
        downloadBlob(filename, blob);
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated, userFiles],
  );

  const handleSourceChange = useCallback(
    (source: string) => {
      const current = activeDocumentRef.current;

      if (current.kind === 'example') return;

      if (current.kind === 'scratch') {
        setScratchSource(source);
        setActiveDocument((document) =>
          document.kind === 'scratch' ? { ...document, source } : document,
        );
        return;
      }

      setActiveDocument((document) =>
        document.kind === 'user' && document.id === current.id ? { ...document, source } : document,
      );
      scheduleSave(source);
    },
    [scheduleSave],
  );

  return {
    activeDocument,
    authLoading,
    authenticated,
    autosaveStatus,
    examples,
    filesLoading,
    handleSourceChange,
    openExample,
    openScratch,
    openUserFile,
    operationError,
    createUserFile,
    deleteUserFile,
    downloadUserFile,
    refresh,
    renameUserFile,
    user,
    userFiles,
  };
}
