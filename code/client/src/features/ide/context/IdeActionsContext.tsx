'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface CompileAction {
  compiling: boolean;
  canCompile: boolean;
  run: () => void;
}

export interface PanelControls {
  explorerVisible: boolean;
  logsVisible: boolean;
  visualizerVisible: boolean;
  toggleExplorer: () => void;
  toggleLogs: () => void;
  toggleVisualizer: () => void;
}

interface IdeActionsContextValue extends CompileAction, PanelControls {
  registerCompileAction: (action: CompileAction) => void;
  registerPanelControls: (controls: PanelControls) => void;
}

const noopCompileAction: CompileAction = {
  compiling: false,
  canCompile: false,
  run: () => {},
};

const noopPanelControls: PanelControls = {
  explorerVisible: true,
  logsVisible: true,
  visualizerVisible: true,
  toggleExplorer: () => {},
  toggleLogs: () => {},
  toggleVisualizer: () => {},
};

const IdeActionsContext = createContext<IdeActionsContextValue | null>(null);

export function IdeActionsProvider({ children }: { children: ReactNode }) {
  const [compileAction, setCompileAction] = useState<CompileAction>(noopCompileAction);
  const [panelControls, setPanelControls] = useState<PanelControls>(noopPanelControls);

  const registerCompileAction = useCallback((action: CompileAction) => {
    setCompileAction(action);
  }, []);

  const registerPanelControls = useCallback((controls: PanelControls) => {
    setPanelControls(controls);
  }, []);

  const value = useMemo<IdeActionsContextValue>(
    () => ({
      ...compileAction,
      ...panelControls,
      registerCompileAction,
      registerPanelControls,
    }),
    [compileAction, panelControls, registerCompileAction, registerPanelControls],
  );

  return <IdeActionsContext.Provider value={value}>{children}</IdeActionsContext.Provider>;
}

export function useIdeActions() {
  const context = useContext(IdeActionsContext);

  if (!context) {
    throw new Error('useIdeActions must be used within an IdeActionsProvider');
  }

  return context;
}
