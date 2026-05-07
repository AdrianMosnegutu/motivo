interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className = 'w-3.5 h-3.5' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" className="opacity-80" />
    </svg>
  );
}
