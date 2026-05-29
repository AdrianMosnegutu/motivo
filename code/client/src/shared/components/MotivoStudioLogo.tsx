import { cn } from '@/lib/utils';

interface MotivoStudioLogoProps {
  compact?: boolean;
  className?: string;
}

export default function MotivoStudioLogo({ compact = false, className }: MotivoStudioLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex size-7 items-center justify-center rounded-md drop-shadow-[0_0_5px_rgba(56,189,248,0.2)]"
        style={{ backgroundImage: 'linear-gradient(153deg, #38bdf8 0%, #a855f7 100%)' }}
      >
        <span className="text-sm font-bold leading-none text-white">M</span>
      </div>
      {!compact ? (
        <span className="text-base font-semibold tracking-[-0.4px] text-white">Motivo Studio</span>
      ) : null}
    </div>
  );
}
