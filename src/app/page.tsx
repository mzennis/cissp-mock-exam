import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Card, Icons, PageContainer, SectionLabel, buttonClass } from "@/components/ui";
import { PASSING_SCORE, SECONDS_PER_QUESTION, domainColor } from "@/lib/constants";

type RecentScore = { score_pct: number; passed: boolean };

async function getUserQuestionCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("user_questions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return 0;
  return count ?? 0;
}

async function getDomains() {
  const supabase = await createClient();
  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .order("id");

  if (!domains) return [];

  const { data: questionRows } = await supabase
    .from("questions")
    .select("domain_id");

  const countMap: Record<number, number> = {};
  questionRows?.forEach((q: { domain_id: number }) => {
    countMap[q.domain_id] = (countMap[q.domain_id] || 0) + 1;
  });

  return domains.map((d) => ({
    ...d,
    question_count: countMap[d.id] || 0,
  }));
}

async function getRecentScores(): Promise<{
  fullExam: RecentScore | null;
  byDomain: Record<number, RecentScore>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { fullExam: null, byDomain: {} };

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("mode, domain_id, score_pct, passed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!attempts) return { fullExam: null, byDomain: {} };

  let fullExam: RecentScore | null = null;
  const byDomain: Record<number, RecentScore> = {};

  for (const a of attempts) {
    if (a.mode === "full_exam" && !fullExam) {
      fullExam = { score_pct: a.score_pct, passed: a.passed };
    } else if (a.mode === "quiz" && a.domain_id && !byDomain[a.domain_id]) {
      byDomain[a.domain_id] = { score_pct: a.score_pct, passed: a.passed };
    }
  }

  return { fullExam, byDomain };
}

export default async function Home() {
  const [domains, scores, userQuestionCount] = await Promise.all([
    getDomains(),
    getRecentScores(),
    getUserQuestionCount(),
  ]);
  const totalQuestions = domains.reduce(
    (acc, d) => acc + (d.question_count || 0),
    0
  );
  const examMinutes = Math.round((totalQuestions * SECONDS_PER_QUESTION) / 60);
  const attemptedDomains = Object.keys(scores.byDomain).length;

  const stats = [
    { label: "Questions", value: totalQuestions },
    { label: "Domains", value: domains.length },
    { label: "Pass mark", value: `${PASSING_SCORE}%` },
    {
      label: "Domains practiced",
      value: `${attemptedDomains}/${domains.length}`,
    },
  ];

  return (
    <PageContainer width="max-w-5xl">
      <section className="pt-4 sm:pt-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cissp-teal/10 border border-cissp-teal/25 rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase text-cissp-teal mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-cissp-teal animate-pulse" />
          CISSP Exam Prep
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] max-w-2xl">
          Practice smarter for the{" "}
          <span className="bg-gradient-to-r from-cissp-teal to-[#818CF8] bg-clip-text text-transparent">
            CISSP exam
          </span>
        </h1>
        <p className="text-cissp-text-secondary text-base mt-4 max-w-xl leading-relaxed">
          Drill each of the 8 domains, then test yourself under timed
          conditions. Missed questions are saved for focused review.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {stats.map((s) => (
            <Card key={s.label} className="px-4 py-3.5">
              <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
              <div className="text-xs text-cissp-text-muted mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      <Link
        href="/exam"
        className="group relative block overflow-hidden rounded-2xl border border-cissp-teal/30 bg-gradient-to-br from-[#123448] via-[#0F2A3B] to-[#0C1624] p-6 sm:p-8 mb-12 transition-all hover:border-cissp-teal/60 hover:shadow-[0_20px_60px_-20px_rgba(95,195,212,0.45)]"
      >
        <div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cissp-teal/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cissp-teal">
                Full Mock Exam
              </span>
              {scores.fullExam && (
                <span className="flex items-center gap-1.5 text-xs text-cissp-text-muted">
                  Last score
                  <ScoreBadge
                    score={scores.fullExam.score_pct}
                    passed={scores.fullExam.passed}
                  />
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {totalQuestions} questions, all domains
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-cissp-text-secondary">
              <span className="flex items-center gap-1.5">
                <Icons.Clock size={15} /> ~{Math.floor(examMinutes / 60)}h {examMinutes % 60}m timed
              </span>
              <span className="flex items-center gap-1.5">
                <Icons.Refresh size={15} /> Randomized order
              </span>
              <span className="flex items-center gap-1.5">
                <Icons.History size={15} /> Per-domain breakdown
              </span>
            </div>
          </div>
          <span className={buttonClass("primary", "lg", "shrink-0 group-hover:gap-3")}>
            Start exam <Icons.ArrowRight size={16} />
          </span>
        </div>
      </Link>

      <div className="flex items-end justify-between mb-4">
        <div>
          <SectionLabel>Practice by domain</SectionLabel>
          <p className="text-sm text-cissp-text-muted mt-1">
            Untimed quizzes with instant feedback and explanations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {domains.map((d) => {
          const color = domainColor(d.id);
          const recent = scores.byDomain[d.id];
          return (
            <Link
              key={d.id}
              href={`/quiz/${d.id}`}
              className="group relative overflow-hidden p-5 bg-cissp-card border border-cissp-border rounded-2xl hover:bg-cissp-card-hover hover:border-cissp-border-hover hover:-translate-y-0.5 transition-all flex flex-col gap-3"
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                aria-hidden="true"
              />
              <div className="flex items-start gap-4">
                <span
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold border"
                  style={{
                    color,
                    backgroundColor: `${color}1A`,
                    borderColor: `${color}40`,
                  }}
                >
                  {d.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-cissp-text group-hover:text-white transition-colors leading-snug">
                    {d.name}
                  </div>
                  <div className="text-xs text-cissp-text-muted mt-1">
                    {d.weight} of exam · {d.question_count} questions
                  </div>
                </div>
                <span className="text-cissp-text-dim group-hover:text-cissp-teal group-hover:translate-x-0.5 transition-all">
                  <Icons.ArrowRight size={16} />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  {recent && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${recent.score_pct}%`,
                        backgroundColor: recent.passed ? "var(--color-cissp-green)" : "var(--color-cissp-red)",
                      }}
                    />
                  )}
                </div>
                {recent ? (
                  <ScoreBadge score={recent.score_pct} passed={recent.passed} />
                ) : (
                  <span className="text-[11px] text-cissp-text-dim">Not started</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {userQuestionCount > 0 && (
        <Link
          href="/quiz/custom"
          className="mt-3 p-5 bg-cissp-card border border-cissp-border rounded-2xl flex items-center gap-4 hover:bg-cissp-card-hover hover:border-cissp-border-hover transition-all group"
        >
          <span className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-[#2DD4BF]/10 border border-[#2DD4BF]/25 text-[#2DD4BF]">
            <Icons.Upload size={17} />
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-cissp-text group-hover:text-white transition-colors">
              My Questions
            </div>
            <div className="text-xs text-cissp-text-muted mt-0.5">
              {userQuestionCount} imported question{userQuestionCount === 1 ? "" : "s"}
            </div>
          </div>
          <span className="text-cissp-text-dim group-hover:text-cissp-teal transition-colors">
            <Icons.ArrowRight size={16} />
          </span>
        </Link>
      )}

      <Card className="mt-12 p-5 grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-xs font-semibold text-cissp-text-secondary mb-1">Passing score</div>
          <div className="text-cissp-text-muted">700/1000 (~70%) on the real exam</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-cissp-text-secondary mb-1">Real exam format</div>
          <div className="text-cissp-text-muted">100–150 questions, 3 hours, CAT</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-cissp-text-secondary mb-1">Study tip</div>
          <div className="text-cissp-text-muted">Focus on domains where you score below 70%</div>
        </div>
      </Card>
    </PageContainer>
  );
}
