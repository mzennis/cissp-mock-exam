import { PASSING_SCORE } from "@/lib/constants";

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

  // Weakest domains first so it's obvious where to focus
  const entries = Object.entries(results).sort(([, a], [, b]) => a.pct - b.pct);

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-cissp-text-dim font-semibold">
          Domain breakdown
        </div>
        <div className="text-[11px] text-cissp-text-dim">Weakest first · marker = {PASSING_SCORE}%</div>
      </div>
      <div className="bg-cissp-card border border-cissp-border rounded-2xl divide-y divide-cissp-border">
        {entries.map(([name, dr]) => {
          const pass = dr.pct >= PASSING_SCORE;
          return (
            <div key={name} className="px-5 py-3.5">
              <div className="flex justify-between items-center gap-4 mb-2">
                <span className="text-[13px] text-cissp-text">{name}</span>
                <span className="text-[13px] tabular-nums shrink-0">
                  <span className="text-cissp-text-muted">
                    {dr.correct}/{dr.total}
                  </span>{" "}
                  <span className={`font-semibold ${pass ? "text-cissp-green" : "text-cissp-red"}`}>
                    {dr.pct}%
                  </span>
                </span>
              </div>
              <div className="relative w-full h-1.5 bg-white/[0.06] rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pass ? "bg-cissp-green" : "bg-cissp-red"
                  }`}
                  style={{ width: `${dr.pct}%` }}
                />
                <div
                  className="absolute -top-0.5 -bottom-0.5 w-px bg-cissp-text-secondary/70"
                  style={{ left: `${PASSING_SCORE}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
