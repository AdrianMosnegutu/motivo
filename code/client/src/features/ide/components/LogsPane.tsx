'use client';

import { useMemo } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { groupDiagnosticsByType } from '@/features/compile/diagnostics';
import type { Diagnostic, LogEntry } from '@/features/compile/types';

const TYPE_COLORS: Record<string, string> = {
  lexical: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  syntax: 'bg-orange-900/60 text-orange-300 border-orange-700',
  semantic: 'bg-red-900/60 text-red-300 border-red-700',
  lowering: 'bg-purple-900/60 text-purple-300 border-purple-700',
  output: 'bg-blue-900/60 text-blue-300 border-blue-700',
  internal: 'bg-zinc-700/60 text-zinc-300 border-zinc-600',
};

const SEVERITY_COLORS: Record<string, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  note: 'text-blue-600 dark:text-blue-400',
};

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface LogsPaneProps {
  log: LogEntry | null;
  onClear: () => void;
  onJump?: (line: number, column: number) => void;
  onToggleCollapse?: () => void;
}

function DiagnosticItem({
  diagnostic,
  onJump,
}: {
  diagnostic: Diagnostic;
  onJump?: (line: number, column: number) => void;
}) {
  const handleJump = () => {
    if (diagnostic.line != null && diagnostic.column != null) {
      onJump?.(diagnostic.line, diagnostic.column);
    }
  };

  const hasLocation = diagnostic.line != null && diagnostic.column != null;

  return (
    <div className="pb-1 border-b border-border/40 last:border-0 leading-tight">
      <div className="inline-flex items-baseline gap-1.5 flex-wrap text-sm">
        <span
          className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${SEVERITY_COLORS[diagnostic.severity]}`}
        >
          {diagnostic.severity}:
        </span>

        {diagnostic.location ? (
          <button
            onClick={handleJump}
            disabled={!hasLocation}
            className="text-indigo-500 dark:text-indigo-400 font-mono font-bold text-xs underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors disabled:no-underline disabled:cursor-default cursor-pointer"
          >
            [{diagnostic.location}]
          </button>
        ) : (
          diagnostic.line != null && (
            <button
              onClick={handleJump}
              className="text-indigo-500 dark:text-indigo-400 font-mono font-bold text-xs underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors cursor-pointer"
            >
              [{diagnostic.line}
              {diagnostic.column != null ? `:${diagnostic.column}` : ''}]
            </button>
          )
        )}

        <span
          className={`${diagnostic.severity === 'error' ? 'font-medium' : ''} ${SEVERITY_COLORS[diagnostic.severity]} wrap-break-word`}
        >
          {diagnostic.message}
        </span>
      </div>
    </div>
  );
}

export default function LogsPane({ log, onClear, onJump, onToggleCollapse }: LogsPaneProps) {
  const groupedDiagnostics = useMemo(() => {
    if (!log || log.kind !== 'error') return null;

    return groupDiagnosticsByType(log.diagnostics);
  }, [log]);

  return (
    <div className="flex h-full flex-col overflow-hidden border border-[#2a303c] bg-[#0b0e14]">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#2a303c] bg-[#151921] px-4">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.6px] text-[#94a3b8]">
          Logs
        </span>
        <div className="flex items-center gap-1">
          <Button
            onClick={onClear}
            disabled={!log}
            variant="ghost"
            size="icon-xs"
            aria-label="Clear"
            title="Clear logs"
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 aria-hidden />
          </Button>
          {onToggleCollapse ? (
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon-xs"
              aria-label="Collapse logs"
              title="Collapse logs"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono">
        {!log ? (
          <span className="text-zinc-500 text-sm">No output yet.</span>
        ) : log.kind === 'success' ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <span>OK</span>
            <span>Compiled successfully</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-xs ml-auto">
              {fmt(log.timestamp)}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-1">
              <span className="text-red-500 text-[10px] font-bold uppercase tracking-tight">
                Compilation Failed ({log.diagnostics.length}{' '}
                {log.diagnostics.length === 1 ? 'issue' : 'issues'})
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                {fmt(log.timestamp)}
              </span>
            </div>

            <div className="space-y-4">
              {groupedDiagnostics &&
                Object.entries(groupedDiagnostics).map(([stage, diagnostics]) => (
                  <div key={stage} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded border font-bold uppercase tracking-widest ${TYPE_COLORS[stage] ?? TYPE_COLORS.internal}`}
                      >
                        {stage}
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {diagnostics.map((d, i) => (
                        <DiagnosticItem key={i} diagnostic={d} onJump={onJump} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
