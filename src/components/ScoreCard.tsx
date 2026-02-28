interface ScoreCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function ScoreCard({ label, value, color = "text-cissp-teal" }: ScoreCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-5 text-center border border-cissp-border">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-cissp-text-muted mt-1">{label}</div>
    </div>
  );
}
