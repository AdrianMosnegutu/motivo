export const IDE_FIGMA_SOURCE = {
  fileKey: 'MrBElOGblQN6wUyrThnWQc',
  nodeId: '2:5',
} as const;

export const IDE_FOUNDATION_CONTRACT = {
  shell: {
    topBarHeight: 48,
    panelHeaderHeight: 32,
    editorTabHeight: 40,
    sidebarWidth: 256,
    playbackRailWidth: 450,
    pianoKeysWidth: 48,
    spacing: {
      compact: 4,
      default: 8,
      comfortable: 12,
      panelPadding: 16,
    },
    radius: {
      sm: 4,
      md: 6,
      lg: 8,
      full: 9999,
    },
  },
  typography: {
    appTitle: { size: 16, weight: 600, tracking: -0.4 },
    panelLabel: { size: 11, weight: 700, tracking: 0.55 },
    fileName: { size: 13, weight: 400 },
    code: { size: 13, lineHeight: 22 },
    monoMeta: { size: 12, lineHeight: 16 },
  },
  iconSizing: {
    compact: 12,
    default: 14,
    toolbar: 16,
  },
  colors: {
    shellBg: 'bg-ide-surface',
    shellMuted: 'bg-ide-surface-muted',
    activeRow: 'bg-ide-active',
    activeBorder: 'border-ide-active-border',
    tabIdle: 'bg-ide-tab',
    tabActive: 'bg-ide-tab-active',
    info: 'text-ide-log-info',
    success: 'text-ide-log-success',
    warning: 'text-ide-log-warning',
    error: 'text-ide-log-error',
    compileCta: 'bg-success text-success-foreground',
  },
} as const;

export const IDE_BEHAVIOR_CONTRACT = {
  releaseScope: 'feature-expansion-plus-redesign',
  tabs: {
    model: 'single-tab-per-file',
    multiFileRequired: true,
    scratchFileName: 'unsaved',
    scratchRenameable: false,
    sampleFilesReadOnly: true,
    sampleFilesDownloadable: true,
  },
  save: {
    manualOnly: true,
    shortcut: 'cmdOrCtrl+s',
    saveIndicator: ['out-of-sync', 'saving', 'synced'] as const,
    promptOnFailureEveryAttempt: true,
  },
  keyboard: {
    keepExistingBehavior: true,
  },
} as const;
