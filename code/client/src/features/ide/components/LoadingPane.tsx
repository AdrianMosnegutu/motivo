interface LoadingPaneProps {
  label: string;
  className?: string;
}

export default function LoadingPane({ label, className = '' }: LoadingPaneProps) {
  return (
    <div
      className={`flex flex-1 items-center justify-center text-zinc-400 font-mono text-sm ${className}`}
    >
      {label}
    </div>
  );
}
