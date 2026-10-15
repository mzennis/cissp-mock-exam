interface ScoreCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function ScoreCard({ label, value, color = "text-cissp-teal" }: ScoreCardProps) {
  return (
    <div className="bg-cissp-card rounded-2xl px-4 py-5 text-center border border-cissp-border">
      <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-cissp-text-muted mt-1.5">{label}</div>
    </div>
  );
}
