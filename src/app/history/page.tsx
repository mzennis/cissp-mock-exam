import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Domain, ExamAttempt } from "@/lib/types";
import { ButtonLink, Card, EmptyState, Icons, PageContainer, PageHeader, SectionLabel } from "@/components/ui";
import { PASSING_SCORE, CUSTOM_QUIZ_COLOR, domainColor } from "@/lib/constants";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: attempts }, { data: domains }] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("domains").select("*").order("id"),
  ]);

  const typedAttempts = (attempts || []) as ExamAttempt[];
  const domainMap = new Map(((domains || []) as Domain[]).map((d) => [d.id, d]));

  // Last 10 for trend (reversed to chronological)
  const trendData = typedAttempts.slice(0, 10).reverse();

  const count = typedAttempts.length;
  const avg = count
    ? Math.round(typedAttempts.reduce((acc, a) => acc + a.score_pct, 0) / count)
    : 0;
  const best = count ? Math.max(...typedAttempts.map((a) => a.score_pct)) : 0;
  const passRate = count
    ? Math.round((typedAttempts.filter((a) => a.passed).length / count) * 100)
    : 0;

  const describe = (a: ExamAttempt) => {
    if (a.mode === "full_exam") return { title: "Full Mock Exam", tag: "Exam", color: "#5FC3D4" };
    if (a.mode === "custom_quiz") return { title: "My Questions", tag: "Custom", color: CUSTOM_QUIZ_COLOR };
    const d = a.domain_id != null ? domainMap.get(a.domain_id) : undefined;
    return {
      title: d ? d.name : "Domain Quiz",
      tag: a.domain_id ? `D${a.domain_id}` : "Quiz",
      color: domainColor(a.domain_id),
    };
  };

  return (
    <PageContainer>
      <PageHeader
        title="History"
        subtitle="Your last 50 quiz and exam attempts."
        action={
          <ButtonLink href="/" size="sm">
            <Icons.ArrowLeft size={15} /> Home
          </ButtonLink>
        }
      />

      {count === 0 ? (
        <EmptyState
          icon={<Icons.History />}
          title="No attempts yet"
          description="Complete a domain quiz or the full mock exam to start tracking your progress."
          action={
            <ButtonLink href="/exam" variant="primary">
              Take your first exam <Icons.ArrowRight size={15} />
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Attempts", value: count },
              { label: "Average", value: `${avg}%` },
              { label: "Best", value: `${best}%` },
              { label: "Pass rate", value: `${passRate}%` },
            ].map((s) => (
              <Card key={s.label} className="px-4 py-3.5">
                <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
                <div className="text-xs text-cissp-text-muted mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>

          {trendData.length > 1 && (
            <Card className="mb-8 p-5">
              <div className="flex items-baseline justify-between mb-5">
                <SectionLabel>Score trend · last {trendData.length}</SectionLabel>
                <span className="flex items-center gap-1.5 text-[11px] text-cissp-text-dim">
                  <span className="w-4 border-t border-dashed border-cissp-text-secondary/60" />
                  {PASSING_SCORE}% pass
                </span>
              </div>
              <div className="relative h-32">
                <div
                  className="absolute inset-x-0 border-t border-dashed border-cissp-text-secondary/40"
                  style={{ bottom: `${PASSING_SCORE}%` }}
                  aria-hidden="true"
                />
                <div className="relative flex items-end gap-2 h-full">
                  {trendData.map((a) => (
                    <div
                      key={a.id}
                      className="group flex-1 h-full flex flex-col justify-end items-center"
                      title={`${describe(a).title}: ${a.score_pct}%`}
                    >
                      <span className="text-[10px] text-cissp-text-muted mb-1 tabular-nums">
                        {a.score_pct}%
                      </span>
                      <div
                        className={`w-full max-w-10 rounded-t-md transition-opacity group-hover:opacity-100 ${
                          a.passed ? "bg-cissp-green/70" : "bg-cissp-red/60"
                        } opacity-85`}
                        style={{ height: `${Math.max(a.score_pct, 3)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-cissp-border" />
            </Card>
          )}

          <SectionLabel className="mb-3">All attempts</SectionLabel>
          <Card className="divide-y divide-cissp-border overflow-hidden">
            {typedAttempts.map((a) => {
              const info = describe(a);
              return (
                <div key={a.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <span
                    className="h-9 w-12 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold border"
                    style={{
                      color: info.color,
                      backgroundColor: `${info.color}1A`,
                      borderColor: `${info.color}40`,
                    }}
                  >
                    {info.tag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cissp-text truncate">{info.title}</div>
                    <div className="text-xs text-cissp-text-muted mt-0.5">
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {a.time_spent_seconds
                        ? ` · ${Math.floor(a.time_spent_seconds / 60)}m`
                        : ""}
                    </div>
                  </div>
                  <span className="hidden sm:inline text-sm text-cissp-text-muted tabular-nums">
                    {a.correct_answers}/{a.total_questions}
                  </span>
                  <span
                    className={`w-14 text-right text-lg font-bold tabular-nums ${
                      a.passed ? "text-cissp-green" : "text-cissp-red"
                    }`}
                  >
                    {a.score_pct}%
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
