export function ScoreBadge({
  score,
  passed,
}: {
  score: number;
  passed: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        passed
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      {score}%
    </span>
  );
}
