import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ScoreBadge";

type RecentScore = { score_pct: number; passed: boolean };

async function getUserQuestionCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("user_questions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

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

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10 pt-4">
          <div className="inline-block px-4 py-1.5 bg-cissp-teal/15 border border-cissp-teal/30 rounded-full text-xs tracking-[0.15em] uppercase text-cissp-teal mb-4">
            CISSP Exam Prep
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Mock Exam Practice
          </h1>
          <p className="text-cissp-text-secondary text-sm max-w-lg mx-auto">
            {totalQuestions} questions across all 8 domains. Practice by domain
            or take the full exam.
          </p>
        </div>

        <Link
          href="/exam"
          className="w-full p-5 bg-gradient-to-r from-cissp-accent to-[#2B6777] border border-cissp-teal/30 rounded-xl text-white text-lg font-semibold flex items-center justify-between hover:-translate-y-0.5 transition-transform mb-8"
        >
          <span>Full Mock Exam — {totalQuestions} Questions</span>
          <span className="text-sm text-cissp-text-secondary flex items-center gap-3">
            Timed &bull; Randomized &bull; All Domains
            {scores.fullExam && (
              <ScoreBadge
                score={scores.fullExam.score_pct}
                passed={scores.fullExam.passed}
              />
            )}
          </span>
        </Link>

        <div className="text-xs uppercase tracking-[0.15em] text-cissp-text-dim font-semibold mb-4">
          Practice by Domain
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {domains.map((d) => (
            <Link
              key={d.id}
              href={`/quiz/${d.id}`}
              className="p-4 bg-cissp-card border border-cissp-border rounded-lg hover:bg-cissp-card-hover hover:border-cissp-border-hover transition-all flex flex-col gap-1.5 group"
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className="text-xs font-bold tracking-wider"
                  style={{ color: d.color }}
                >
                  DOMAIN {d.id}
                </span>
                <span className="flex items-center gap-2">
                  {scores.byDomain[d.id] && (
                    <ScoreBadge
                      score={scores.byDomain[d.id].score_pct}
                      passed={scores.byDomain[d.id].passed}
                    />
                  )}
                  <span className="text-xs text-cissp-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                    {d.weight} &bull; {d.question_count}Q
                  </span>
                </span>
              </div>
              <span className="text-sm font-medium text-cissp-text group-hover:text-white transition-colors">
                {d.name}
              </span>
            </Link>
          ))}
        </div>

        {userQuestionCount > 0 && (
          <div className="mt-6">
            <Link
              href="/quiz/custom"
              className="w-full p-4 bg-cissp-card border border-cissp-border rounded-lg flex items-center justify-between hover:bg-cissp-card-hover hover:border-cissp-border-hover transition-all group"
            >
              <div>
                <span className="text-xs font-bold tracking-wider text-cissp-teal">
                  MY QUESTIONS
                </span>
                <div className="text-sm font-medium text-cissp-text group-hover:text-white transition-colors mt-0.5">
                  Practice imported questions
                </div>
              </div>
              <span className="text-xs text-cissp-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                {userQuestionCount}Q
              </span>
            </Link>
          </div>
        )}

        <div className="mt-8 p-4 bg-white/[0.03] rounded-lg border border-cissp-border">
          <div className="text-xs text-cissp-text-muted leading-relaxed">
            <strong className="text-cissp-text-secondary">
              Passing Score:
            </strong>{" "}
            700/1000 (~70%) &nbsp;&bull;&nbsp;
            <strong className="text-cissp-text-secondary">
              Real Exam:
            </strong>{" "}
            125-175 questions, 4 hours, CAT format &nbsp;&bull;&nbsp;
            <strong className="text-cissp-text-secondary">Tip:</strong> Focus on
            domains where you score below 70%
          </div>
        </div>
      </div>
    </div>
  );
}
