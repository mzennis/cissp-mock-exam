"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { Question, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE } from "@/lib/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CustomQuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const supabase = createClient();
    supabase
      .from("user_questions")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setQuestions(shuffle(data));
        setLoading(false);
      });
  }, [user, authLoading, router]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      const q = questions[currentQ];
      const correct = idx === q.answer;
      setSelectedAnswer(idx);
      setIsAnswered(true);
      setAnswers((prev) => ({
        ...prev,
        [q.id]: { question_id: q.id, selected: idx, correct },
      }));
    },
    [isAnswered, questions, currentQ]
  );

  const navigateTo = useCallback(
    (idx: number) => {
      const q = questions[idx];
      const existing = answers[q.id];
      setCurrentQ(idx);
      setSelectedAnswer(existing?.selected ?? null);
      setIsAnswered(!!existing);
    },
    [questions, answers]
  );

  const finishQuiz = useCallback(async () => {
    const answerList = Object.values(answers);
    const correct = answerList.filter((a) => a.correct).length;
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);

    if (user) {
      const supabase = createClient();
      await supabase.from("exam_attempts").insert({
        user_id: user.id,
        mode: "custom_quiz",
        total_questions: total,
        correct_answers: correct,
        score_pct: pct,
        passed: pct >= PASSING_SCORE,
        answers: answerList,
      });
    }

    const resultData = {
      mode: "custom_quiz",
      domainName: "My Questions",
      total: questions.length,
      correct,
      pct,
      passed: pct >= PASSING_SCORE,
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    router.push("/results");
  }, [answers, questions, user, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">Loading questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-cissp-text-muted">No imported questions found.</div>
        <button
          onClick={() => router.push("/import")}
          className="text-sm text-cissp-teal hover:text-white transition-colors cursor-pointer"
        >
          Import questions &rarr;
        </button>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/")}
            className="bg-cissp-card border border-cissp-border rounded-lg text-cissp-text-secondary px-3.5 py-2 text-[13px] cursor-pointer hover:bg-cissp-card-hover transition-colors"
          >
            &larr; Back
          </button>
          <span className="text-[13px] text-cissp-text-muted">
            {Object.values(answers).filter((a) => a.correct).length}/
            {Object.keys(answers).length} correct
          </span>
        </div>

        <ProgressBar
          current={currentQ + 1}
          total={questions.length}
          color="#4FD1C5"
          label="My Questions"
        />

        <QuestionCard
          question={q}
          domainColor="#4FD1C5"
          selectedAnswer={selectedAnswer}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
          isBookmarked={false}
          onToggleBookmark={() => {}}
          showBookmark={false}
        />

        <div className="flex justify-between">
          <button
            onClick={() => navigateTo(currentQ - 1)}
            disabled={currentQ === 0}
            className={`px-5 py-2.5 rounded-lg border border-cissp-border text-sm ${
              currentQ === 0
                ? "bg-white/[0.02] text-[#4A5A6A] cursor-default"
                : "bg-cissp-card text-cissp-text-secondary cursor-pointer hover:bg-cissp-card-hover"
            }`}
          >
            &larr; Previous
          </button>
          <button
            onClick={() =>
              currentQ === questions.length - 1
                ? finishQuiz()
                : navigateTo(currentQ + 1)
            }
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold cursor-pointer bg-cissp-teal hover:bg-cissp-teal/80 transition-colors"
          >
            {currentQ === questions.length - 1 ? "Finish Quiz \u2192" : "Next \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
