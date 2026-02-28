"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreCard } from "@/components/ScoreCard";
import { DomainBreakdown } from "@/components/DomainBreakdown";
import { useAuth } from "@/components/AuthProvider";

interface ResultData {
  mode: "quiz" | "full_exam";
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">No results to display.</div>
      </div>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-2xl pt-4">
        <div className="text-center mb-9">
          <div className="text-6xl mb-3">{result.passed ? "\uD83C\uDF89" : "\uD83D\uDCDA"}</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {result.passed ? "Passed!" : "Keep Studying"}
          </h2>
          <p className="text-cissp-text-secondary text-sm">
            {result.mode === "quiz" && result.domainName
              ? `Domain: ${result.domainName}`
              : "Full Mock Exam"}
            {!user && " \u2022 Login to save your results"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-7">
          <ScoreCard
            label="Score"
            value={`${result.pct}%`}
            color={result.passed ? "text-cissp-green" : "text-cissp-red"}
          />
          <ScoreCard label="Correct" value={result.correct} />
          <ScoreCard
            label={result.timeSpent ? "Time" : "Total"}
            value={result.timeSpent ? formatTime(result.timeSpent) : result.total}
            color="text-cissp-text-secondary"
          />
        </div>

        {result.domainBreakdown && (
          <DomainBreakdown results={result.domainBreakdown} />
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3.5 bg-cissp-card border border-cissp-border rounded-lg text-cissp-text-secondary text-[15px] cursor-pointer hover:bg-cissp-card-hover transition-colors"
          >
            &larr; Back to Domains
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("examResult");
              if (result.mode === "quiz" && result.domainId) {
                router.push(`/quiz/${result.domainId}`);
              } else {
                router.push("/exam");
              }
            }}
            className="flex-1 py-3.5 bg-cissp-accent rounded-lg text-white text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
