'use client';

import { PanelBottom, PanelLeft, PanelRight, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AuthShell from '@/features/auth/components/AuthShell';
import { cn } from '@/lib/utils';
import MotivoStudioLogo from '@/shared/components/MotivoStudioLogo';
import Spinner from '@/shared/components/Spinner';

import { useIdeActions } from '../context/IdeActionsContext';

function PanelToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            '[&_svg]:size-4',
            active
              ? 'bg-[#38bdf8]/15 text-[#38bdf8] hover:bg-[#38bdf8]/20 hover:text-[#38bdf8]'
              : 'text-[#94a3b8] hover:bg-muted hover:text-[#e2e8f0]',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function AppHeader() {
  const {
    canCompile,
    compiling,
    run,
    explorerVisible,
    logsVisible,
    visualizerVisible,
    toggleExplorer,
    toggleLogs,
    toggleVisualizer,
  } = useIdeActions();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#0f172a] px-4">
      <MotivoStudioLogo />

      <div className="flex items-center gap-5">
        <Button
          type="button"
          onClick={run}
          disabled={!canCompile || compiling}
          className="h-8 gap-2 rounded-md bg-[#22c55e] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#22c55e]/90"
        >
          {compiling ? <Spinner /> : <Play aria-hidden />}
          {compiling ? 'Compiling...' : 'Compile'}
        </Button>

        <Separator orientation="vertical" className="h-[18px] bg-[#334155]" />

        <AuthShell />

        <Separator orientation="vertical" className="h-[18px] bg-[#334155]" />

        <div className="flex items-center gap-0.5">
          <PanelToggle
            active={explorerVisible}
            label="Toggle file explorer"
            onClick={toggleExplorer}
          >
            <PanelLeft aria-hidden />
          </PanelToggle>
          <PanelToggle active={logsVisible} label="Toggle logs panel" onClick={toggleLogs}>
            <PanelBottom aria-hidden />
          </PanelToggle>
          <PanelToggle
            active={visualizerVisible}
            label="Toggle visualizer"
            onClick={toggleVisualizer}
          >
            <PanelRight aria-hidden />
          </PanelToggle>
        </div>
      </div>
    </header>
  );
}
