import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseClass = 'flex items-center justify-center w-8 h-8 rounded transition-colors';
const activeClass =
  'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 cursor-pointer';
const disabledClass =
  'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed';

interface PlaybackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  enabled: boolean;
  children: ReactNode;
}

export default function PlaybackButton({
  enabled,
  children,
  className = '',
  ...props
}: PlaybackButtonProps) {
  return (
    <button
      className={`${baseClass} ${enabled ? activeClass : disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
