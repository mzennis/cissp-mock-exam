"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScoreCard } from "@/components/ScoreCard";
import { DomainBreakdown } from "@/components/DomainBreakdown";
import { useAuth } from "@/components/AuthProvider";
import { Button, ButtonLink, Card, EmptyState, Icons, PageContainer } from "@/components/ui";
import { PASSING_SCORE } from "@/lib/constants";

interface ResultData {
  mode: "quiz" | "full_exam" | "custom_quiz";
  domainId?: number;
  domainName?: string;
  total: number;
  correct: number;
  pct: number;
  passed: boolean;
  timeSpent?: number;
  domainBreakdown?: Record<
    string,
    { total: number; correct: number; pct: number }
  >;
}

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const color = passed ? "var(--color-cissp-green)" : "var(--color-cissp-red)";
  const passAngle = (PASSING_SCORE / 100) * 360 - 90;
  const px = 64 + r * Math.cos((passAngle * Math.PI) / 180);
  const py = 64 + r * Math.sin((passAngle * Math.PI) / 180);

  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease-out", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      {/* Passing threshold tick (drawn unrotated) */}
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx={px} cy={py} r="3" fill="var(--color-cissp-text)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white tabular-nums">{pct}%</span>
        <span className="text-[11px] text-cissp-text-muted mt-0.5">pass at {PASSING_SCORE}%</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("examResult");
    if (raw) {
      setResult(JSON.parse(raw));
    }
  }, []);

  if (!result) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Icons.History />}
          title="No results to display"
          description="Finish a quiz or exam to see your score breakdown here."
          action={<ButtonLink href="/" variant="primary">Start practicing</ButtonLink>}
        />
      </PageContainer>
    );
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
  };

  const modeLabel =
    result.mode === "full_exam"
      ? "Full Mock Exam"
      : result.mode === "custom_quiz"
        ? "My Questions"
        : `Domain ${result.domainId} · ${result.domainName}`;

  const retryHref =
    result.mode === "quiz" && result.domainId
      ? `/quiz/${result.domainId}`
      : result.mode === "custom_quiz"
        ? "/quiz/custom"
        : "/exam";

  return (
    <PageContainer width="max-w-2xl">
      <Card className="relative overflow-hidden p-8 flex flex-col items-center text-center mb-6">
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full blur-3xl ${
            result.passed ? "bg-cissp-green/15" : "bg-cissp-red/10"
          }`}
          aria-hidden="true"
        />
        <div className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-cissp-text-muted mb-5">
          {modeLabel}
        </div>
        <div className="relative">
          <ScoreRing pct={result.pct} passed={result.passed} />
        </div>
        <h1 className="relative text-2xl sm:text-3xl font-bold text-white mt-5">
          {result.passed ? "You passed" : "Keep studying"}
        </h1>
        <p className="relative text-sm text-cissp-text-secondary mt-1.5 max-w-sm">
          {result.passed
            ? "Strong work. Keep the momentum going with another round."
            : `You need ${PASSING_SCORE}% to pass. Review your weakest areas and try again.`}
        </p>
        {!user && (
          <p className="relative text-xs text-cissp-text-muted mt-4">
            <Link href="/login" className="text-cissp-teal hover:underline">Log in</Link> to save your results and track progress.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <ScoreCard label="Correct" value={result.correct} color="text-cissp-green" />
        <ScoreCard label="Incorrect" value={result.total - result.correct} color="text-cissp-red" />
        <ScoreCard
          label={result.timeSpent ? "Time" : "Questions"}
          value={result.timeSpent ? formatTime(result.timeSpent) : result.total}
          color="text-cissp-text"
        />
      </div>

      {result.domainBreakdown && (
        <DomainBreakdown results={result.domainBreakdown} />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" onClick={() => router.push("/")}>
          <Icons.ArrowLeft size={16} /> Home
        </Button>
        {user && result.correct < result.total && (
          <Button size="lg" className="flex-1" onClick={() => router.push("/review")}>
            Review mistakes
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={() => {
            sessionStorage.removeItem("examResult");
            router.push(retryHref);
          }}
        >
          <Icons.Refresh size={16} /> Try again
        </Button>
      </div>
    </PageContainer>
  );
}
