"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  color: string;
  label?: string;
}

export function ProgressBar({ current, total, color, label }: ProgressBarProps) {
  const pct = (current / total) * 100;

  return (
    <div className="mb-6">
      {label && (
        <div className="flex justify-between items-center gap-4 mb-2">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-xs font-semibold tracking-wide text-cissp-text-secondary truncate">
              {label}
            </span>
          </span>
          <span className="text-xs text-cissp-text-muted tabular-nums shrink-0">
            <span className="text-cissp-text font-semibold">{current}</span> / {total}
          </span>
        </div>
      )}
      <div
        className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
