'use client';

import { useEffect } from 'react';

type ToggleablePanelRef = {
  current?: {
    isCollapsed: () => boolean;
    expand: () => void;
    collapse: () => void;
  } | null;
};

export function useLogsPanelShortcut(logsPanelRef: ToggleablePanelRef) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault();
        const panel = logsPanelRef.current;
        if (!panel) return;

        if (panel.isCollapsed()) {
          panel.expand();
        } else {
          panel.collapse();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logsPanelRef]);
}
