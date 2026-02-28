import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ExamAttempt } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const typedAttempts = (attempts || []) as ExamAttempt[];

  // Last 10 for trend (reversed to chronological)
  const trendData = typedAttempts.slice(0, 10).reverse();

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Exam History</h1>
          <Link
            href="/"
            className="text-sm text-cissp-text-muted hover:text-cissp-text-secondary transition-colors"
          >
            &larr; Home
          </Link>
        </div>

        {trendData.length > 1 && (
          <div className="mb-8 bg-white/[0.03] border border-cissp-border rounded-xl p-5">
            <div className="text-xs font-semibold text-cissp-text-secondary uppercase tracking-wider mb-4">
              Score Trend (Last {trendData.length})
            </div>
            <div className="flex items-end gap-2 h-24">
              {trendData.map((a, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] text-cissp-text-muted">
                    {a.score_pct}%
                  </span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      a.passed ? "bg-cissp-green/60" : "bg-cissp-red/60"
                    }`}
                    style={{ height: `${Math.max(a.score_pct, 5)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 border-t border-cissp-border" />
          </div>
        )}

        {typedAttempts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-cissp-text-muted mb-4">
              No exam attempts yet.
            </div>
            <Link
              href="/exam"
              className="text-cissp-teal hover:text-white transition-colors"
            >
              Take your first exam &rarr;
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {typedAttempts.map((a) => (
              <div
                key={a.id}
                className="bg-cissp-card border border-cissp-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-cissp-text">
                    {a.mode === "full_exam" ? "Full Exam" : "Domain Quiz"}
                  </span>
                  <span className="text-xs text-cissp-text-muted">
                    {new Date(a.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.time_spent_seconds &&
                      ` \u2022 ${Math.floor(a.time_spent_seconds / 60)}m`}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-cissp-text-muted">
                    {a.correct_answers}/{a.total_questions}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      a.passed ? "text-cissp-green" : "text-cissp-red"
                    }`}
                  >
                    {a.score_pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
