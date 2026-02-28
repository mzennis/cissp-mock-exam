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
    <div className="mb-5">
      {label && (
        <div className="flex justify-between mb-1.5">
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color }}
          >
            {label}
          </span>
          <span className="text-[13px] text-cissp-text-muted">
            Q{current} of {total}
          </span>
        </div>
      )}
      <div className="w-full h-1 bg-white/[0.08] rounded-full">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
