interface DomainResult {
  total: number;
  correct: number;
  pct: number;
}

interface DomainBreakdownProps {
  results: Record<string, DomainResult>;
}

export function DomainBreakdown({ results }: DomainBreakdownProps) {
  if (Object.keys(results).length <= 1) return null;

  return (
    <div className="mb-7">
      <div className="text-[13px] font-semibold text-cissp-text-secondary mb-3.5 uppercase tracking-[0.1em]">
        Domain Breakdown
      </div>
      {Object.entries(results).map(([name, dr]) => (
        <div
          key={name}
          className="mb-2.5 bg-white/[0.03] rounded-lg p-3 px-4 border border-cissp-border"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-[#C0D0DA]">{name}</span>
            <span
              className={`text-[13px] font-semibold ${
                dr.pct >= 70 ? "text-cissp-green" : "text-cissp-red"
              }`}
            >
              {dr.correct}/{dr.total} ({dr.pct}%)
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dr.pct >= 70 ? "bg-cissp-green" : "bg-cissp-red"
              }`}
              style={{ width: `${dr.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
