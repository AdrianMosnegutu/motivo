interface PlaybackProgressProps {
  currentSeconds: number;
  duration: number;
  position: string;
  onSeek: (seconds: number) => void;
}

export default function PlaybackProgress({
  currentSeconds,
  duration,
  position,
  onSeek,
}: PlaybackProgressProps) {
  const progress = duration > 0 ? (currentSeconds / duration) * 100 : 0;

  return (
    <div className="flex-1 flex items-center gap-3 min-w-0">
      <input
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={currentSeconds}
        onChange={(event) => onSeek(parseFloat(event.target.value))}
        className="flex-1 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        style={{
          background: `linear-gradient(to right, var(--color-indigo-600) ${progress}%, var(--color-zinc-800) 0%)`,
        }}
      />
      <span className="font-mono text-xs text-zinc-600 dark:text-zinc-200 whitespace-nowrap tabular-nums">
        {position}
      </span>
    </div>
  );
}
