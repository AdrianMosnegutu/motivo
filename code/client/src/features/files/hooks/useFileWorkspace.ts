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
  getDocumentKey,
  toExampleDocument,
  toUserDocument,
  sortUserFiles,
  upsertUserFileSummary,
} from '../lib/documents';
import { downloadBlob, downloadSource } from '../lib/download-source';
import type { ActiveDocument, OpenDocumentTab, UserFileSummary } from '../types';

type ManualSaveStatus = 'idle' | 'saving' | 'error';

const SCRATCH_KEY = 'scratch:scratch';

function replaceUserMetadata(document: ActiveDocument, fileId: string, fileName: string) {
  if (document.kind !== 'user' || document.id !== fileId) return document;
  return { ...document, name: fileName };
}

function upsertOpenTab(tabs: ActiveDocument[], document: ActiveDocument): ActiveDocument[] {
  const key = getDocumentKey(document);
  const withoutCurrent = tabs.filter((tab) => getDocumentKey(tab) !== key);
  return [...withoutCurrent, document];
}

function closeTabWithFallback(tabs: ActiveDocument[], keyToClose: string, scratchSource: string) {
  const closeIndex = tabs.findIndex((tab) => getDocumentKey(tab) === keyToClose);
  const remaining = tabs.filter((tab) => getDocumentKey(tab) !== keyToClose);

  if (remaining.length > 0) {
    const nextIndex = closeIndex > 0 ? closeIndex - 1 : 0;
    const nextTab = remaining[Math.min(nextIndex, remaining.length - 1)];
    return {
      nextActiveKey: getDocumentKey(nextTab),
      nextTabs: remaining,
    };
  }

  const scratch = createScratchDocument(scratchSource);
  return {
    nextActiveKey: SCRATCH_KEY,
    nextTabs: [scratch],
  };
}

export function useFileWorkspace() {
  const { isAuthenticated, refresh: refreshAuth, status: authStatus, user } = useAuth();
  const examples = useMemo(() => listExampleFiles(), []);
  const [filesLoading, setFilesLoading] = useState(false);
  const [userFiles, setUserFiles] = useState<UserFileSummary[]>([]);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [scratchSource, setScratchSource] = useState(DEFAULT_MOTIVO_SNIPPET);
  const [openTabs, setOpenTabs] = useState<ActiveDocument[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('');
  const [dirtyUserFileIds, setDirtyUserFileIds] = useState<Record<string, true>>({});
  const [manualSaveStatus, setManualSaveStatus] = useState<ManualSaveStatus>('idle');
  const dirtyUserFileIdsRef = useRef(dirtyUserFileIds);
  const activeDocument = useMemo(() => {
    if (!activeTabKey) return null;
    return openTabs.find((tab) => getDocumentKey(tab) === activeTabKey) ?? null;
  }, [activeTabKey, openTabs]);
  const activeDocumentRef = useRef(activeDocument);
  const activeTabKeyRef = useRef(activeTabKey);
  const openTabsRef = useRef(openTabs);
  const scratchSourceRef = useRef(scratchSource);
  const filesListedForUserIdRef = useRef<string | null>(null);
  const authUserRef = useRef(user);

  useEffect(() => {
    authUserRef.current = user;
  }, [user]);

  const authenticated = isAuthenticated;
  const authLoading = authStatus === 'loading';

  useEffect(() => {
    activeDocumentRef.current = activeDocument;
  }, [activeDocument]);

  useEffect(() => {
    activeTabKeyRef.current = activeTabKey;
  }, [activeTabKey]);

  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);

  useEffect(() => {
    scratchSourceRef.current = scratchSource;
  }, [scratchSource]);

  useEffect(() => {
    dirtyUserFileIdsRef.current = dirtyUserFileIds;
  }, [dirtyUserFileIds]);

  const markUserFileDirty = useCallback((fileId: string) => {
    setDirtyUserFileIds((current) => (current[fileId] ? current : { ...current, [fileId]: true }));
  }, []);

  const clearUserFileDirty = useCallback((fileId: string) => {
    setDirtyUserFileIds((current) => {
      if (!current[fileId]) return current;
      const next = { ...current };
      delete next[fileId];
      return next;
    });
  }, []);

  const removeUserTabs = useCallback(() => {
    setOpenTabs((current) => current.filter((tab) => tab.kind !== 'user'));
    setActiveTabKey((current) => {
      if (!current.startsWith('user:')) return current;
      const remaining = openTabsRef.current.filter((tab) => tab.kind !== 'user');
      if (remaining.length === 0) return '';
      return getDocumentKey(remaining[remaining.length - 1]);
    });
  }, []);

  const saveSource = useCallback(
    async (fileId: string, source: string) => {
      const file = await updateFile(fileId, { source });
      setUserFiles((current) => upsertUserFileSummary(current, file));
      setOpenTabs((current) =>
        current.map((document) => {
          if (document.kind !== 'user' || document.id !== file.id) return document;
          return {
            ...document,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            lastOpenedAt: file.lastOpenedAt,
            name: file.name,
            source,
          };
        }),
      );
      clearUserFileDirty(fileId);
    },
    [clearUserFileDirty],
  );

  const activateTab = useCallback((key: string) => {
    if (!openTabsRef.current.some((tab) => getDocumentKey(tab) === key)) return false;
    setActiveTabKey(key);
    return true;
  }, []);

  const focusExistingTab = useCallback((key: string) => activateTab(key), [activateTab]);

  const openDocumentInTab = useCallback((document: ActiveDocument) => {
    const key = getDocumentKey(document);
    setOpenTabs((tabs) => {
      const base =
        document.kind === 'scratch' ? tabs : tabs.filter((tab) => tab.kind !== 'scratch');
      return upsertOpenTab(base, document);
    });
    setActiveTabKey(key);
  }, []);

  const openDocumentInTabRef = useRef(openDocumentInTab);

  useEffect(() => {
    openDocumentInTabRef.current = openDocumentInTab;
  }, [openDocumentInTab]);

  const loadUserFiles = useCallback(async (preferredFileId?: string | null) => {
    setFilesLoading(true);
    setOperationError(null);

    try {
      const files = await listFiles();
      setUserFiles(sortUserFiles(files));

      if (preferredFileId && files.some((file) => file.id === preferredFileId)) {
        const file = await readFile(preferredFileId);
        await openDocumentInTabRef.current(toUserDocument(file));
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
      filesListedForUserIdRef.current = null;
      await loadUserFiles(nextUser.lastOpenedFileId);
      filesListedForUserIdRef.current = nextUser.id;
    } else {
      filesListedForUserIdRef.current = null;
      setUserFiles([]);
      removeUserTabs();
    }
  }, [loadUserFiles, refreshAuth, removeUserTabs]);

  const userId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadFilesForAuthState() {
      await Promise.resolve();
      if (cancelled) return;

      if (authStatus === 'loading') {
        setFilesLoading(false);
        return;
      }

      if (!userId) {
        filesListedForUserIdRef.current = null;
        setUserFiles([]);
        setFilesLoading(false);
        removeUserTabs();
        return;
      }

      if (filesListedForUserIdRef.current === userId) {
        setFilesLoading(false);
        return;
      }

      setFilesLoading(true);
      setOperationError(null);

      try {
        const files = await listFiles();
        if (cancelled) return;
        setUserFiles(sortUserFiles(files));
        filesListedForUserIdRef.current = userId;

        const lastOpenedFileId = authUserRef.current?.lastOpenedFileId;
        if (lastOpenedFileId && files.some((file) => file.id === lastOpenedFileId)) {
          const file = await readFile(lastOpenedFileId);
          if (cancelled) return;
          await openDocumentInTabRef.current(toUserDocument(file));
        }
      } catch (error) {
        if (!cancelled) setOperationError(getFileErrorMessage(error));
      } finally {
        setFilesLoading(false);
      }
    }

    void loadFilesForAuthState();

    return () => {
      cancelled = true;
      setFilesLoading(false);
    };
  }, [authStatus, removeUserTabs, userId]);

  const openScratch = useCallback(async () => {
    setOperationError(null);
    if (await focusExistingTab(SCRATCH_KEY)) return;
    await openDocumentInTab(createScratchDocument(scratchSource));
  }, [focusExistingTab, openDocumentInTab, scratchSource]);

  const openExample = useCallback(
    async (id: string) => {
      try {
        setOperationError(null);
        const key = `example:${id}`;
        if (await focusExistingTab(key)) return;
        await openDocumentInTab(toExampleDocument(readExampleFile(id)));
      } catch (error) {
        setOperationError(error instanceof Error ? error.message : 'Example could not be opened.');
      }
    },
    [focusExistingTab, openDocumentInTab],
  );

  const openUserFile = useCallback(
    async (id: string) => {
      if (!authenticated) {
        setOperationError('Sign in to open saved files.');
        return false;
      }

      setOperationError(null);

      try {
        if (await focusExistingTab(`user:${id}`)) return true;
        const file = await readFile(id);
        await openDocumentInTab(toUserDocument(file));
        setUserFiles((current) => upsertUserFileSummary(current, file));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated, focusExistingTab, openDocumentInTab],
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
        await openDocumentInTab(toUserDocument(file));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated, openDocumentInTab],
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
        setOpenTabs((current) =>
          current.map((document) => replaceUserMetadata(document, file.id, file.name)),
        );
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
        clearUserFileDirty(id);

        const keyToClose = `user:${id}`;
        if (openTabsRef.current.some((tab) => getDocumentKey(tab) === keyToClose)) {
          const { nextActiveKey, nextTabs } = closeTabWithFallback(
            openTabsRef.current,
            keyToClose,
            scratchSourceRef.current,
          );
          setOpenTabs(nextTabs);
          setActiveTabKey(nextActiveKey);
        }
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated, clearUserFileDirty],
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

  const downloadExampleFile = useCallback((id: string) => {
    try {
      const file = readExampleFile(id);
      downloadSource(file.name, file.source);
      setOperationError(null);
      return true;
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : 'Example could not be downloaded.',
      );
      return false;
    }
  }, []);

  const downloadActiveDocument = useCallback(async () => {
    const document = activeDocumentRef.current;
    if (!document) return false;

    if (document.kind === 'user') {
      return downloadUserFile(document.id);
    }

    if (document.kind === 'example') {
      return downloadExampleFile(document.id);
    }

    downloadSource('unsaved.motivo', document.source);
    return true;
  }, [downloadExampleFile, downloadUserFile]);

  const forceCloseTab = useCallback((key: string) => {
    if (!openTabsRef.current.some((item) => getDocumentKey(item) === key)) return;
    const { nextActiveKey, nextTabs } = closeTabWithFallback(
      openTabsRef.current,
      key,
      scratchSourceRef.current,
    );
    setOpenTabs(nextTabs);
    setActiveTabKey(nextActiveKey);
  }, []);

  const saveAndCloseTab = useCallback(
    async (key: string) => {
      const tab = openTabsRef.current.find((item) => getDocumentKey(item) === key);
      if (!tab) return true;

      if (tab.kind === 'user') {
        try {
          await saveSource(tab.id, tab.source);
        } catch (error) {
          setOperationError(getFileErrorMessage(error));
          return false;
        }
      }

      forceCloseTab(key);
      return true;
    },
    [forceCloseTab, saveSource],
  );

  const saveScratchAs = useCallback(
    async (name: string) => {
      if (!authenticated) {
        setOperationError('Sign in to save files.');
        return false;
      }

      const scratch = openTabsRef.current.find((tab) => tab.kind === 'scratch');
      const source = scratch?.source ?? scratchSourceRef.current;
      setOperationError(null);

      try {
        const file = await createFile({ name: ensureMotivoFileName(name), source });
        setUserFiles((current) => upsertUserFileSummary(current, file));
        const userDocument = toUserDocument(file);
        setOpenTabs((current) =>
          upsertOpenTab(
            current.filter((tab) => tab.kind !== 'scratch'),
            userDocument,
          ),
        );
        setActiveTabKey(getDocumentKey(userDocument));
        return true;
      } catch (error) {
        setOperationError(getFileErrorMessage(error));
        return false;
      }
    },
    [authenticated],
  );

  const saveActiveDocument = useCallback(async () => {
    const document = activeDocumentRef.current;
    if (!document || document.kind !== 'user') return false;

    setManualSaveStatus('saving');
    try {
      await saveSource(document.id, document.source);
      setManualSaveStatus('idle');
      return true;
    } catch (error) {
      setManualSaveStatus('error');
      setOperationError(getFileErrorMessage(error));
      return false;
    }
  }, [saveSource]);

  useEffect(() => {
    setManualSaveStatus('idle');
  }, [activeTabKey]);

  const focusTab = useCallback((key: string) => focusExistingTab(key), [focusExistingTab]);

  const handleSourceChange = useCallback(
    (documentId: string, source: string) => {
      const tab = openTabsRef.current.find(
        (document) => `${document.kind}:${document.id}` === documentId,
      );
      if (!tab || tab.kind === 'example' || tab.source === source) return;
      const key = getDocumentKey(tab);
      if (key !== activeTabKeyRef.current) return;

      if (tab.kind === 'scratch') {
        setScratchSource(source);
        setOpenTabs((tabs) =>
          tabs.map((document) =>
            getDocumentKey(document) === key ? { ...document, source } : document,
          ),
        );
        return;
      }

      markUserFileDirty(tab.id);
      setOpenTabs((tabs) =>
        tabs.map((document) =>
          getDocumentKey(document) === key ? { ...document, source } : document,
        ),
      );
    },
    [markUserFileDirty],
  );

  const openDocumentTabs = useMemo<OpenDocumentTab[]>(() => {
    return openTabs.map((document) => {
      const key = getDocumentKey(document);

      if (document.kind === 'example') {
        return {
          key,
          kind: document.kind,
          id: document.id,
          name: document.name,
          readOnly: true,
          closable: true,
          syncState: 'readonly',
        };
      }

      if (document.kind === 'scratch') {
        return {
          key,
          kind: document.kind,
          id: document.id,
          name: document.name,
          readOnly: false,
          closable: true,
          syncState: 'out-of-sync',
        };
      }

      const isDirty = Boolean(dirtyUserFileIds[document.id]);
      const isActive = key === activeTabKey;
      const syncState =
        isActive && manualSaveStatus === 'saving'
          ? 'saving'
          : isDirty || (isActive && manualSaveStatus === 'error')
            ? 'out-of-sync'
            : 'synced';

      return {
        key,
        kind: document.kind,
        id: document.id,
        name: document.name,
        readOnly: false,
        closable: true,
        syncState,
      };
    });
  }, [activeTabKey, dirtyUserFileIds, manualSaveStatus, openTabs]);

  return {
    activeDocument,
    activeTabKey,
    authLoading,
    authenticated,
    forceCloseTab,
    saveAndCloseTab,
    saveActiveDocument,
    saveScratchAs,
    downloadActiveDocument,
    downloadExampleFile,
    examples,
    filesLoading,
    focusTab,
    handleSourceChange,
    openTabs: openDocumentTabs,
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
