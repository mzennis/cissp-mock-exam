"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import type { Question, Domain } from "@/lib/types";

interface WrongAnswerQuestion extends Question {
  domains: Domain;
  last_selected: number;
  attempt_count: number;
  wrong_answer_id: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<WrongAnswerQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadWrongAnswers = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("user_wrong_answers")
      .select("id, last_selected, attempt_count, question_id, questions(*, domains:domain_id(*))")
      .eq("user_id", user.id)
      .order("attempt_count", { ascending: false });

    if (data) {
      const qs = data
        .map((wa: Record<string, unknown>) => ({
          ...(wa.questions as Question & { domains: Domain }),
          last_selected: wa.last_selected as number,
          attempt_count: wa.attempt_count as number,
          wrong_answer_id: wa.id as string,
        }))
        .filter((q: WrongAnswerQuestion) => q.id);
      setQuestions(qs);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) loadWrongAnswers();
  }, [user, authLoading, router, loadWrongAnswers]);

  const handleAnswer = useCallback(
    async (idx: number) => {
      if (isAnswered) return;
      const q = questions[currentQ];
      const correct = idx === q.answer;
      setSelectedAnswer(idx);
      setIsAnswered(true);

      if (correct && user) {
        const supabase = createClient();
        await supabase
          .from("user_wrong_answers")
          .delete()
          .eq("id", q.wrong_answer_id);

        // Remove from local list after short delay so user sees the green
        setTimeout(() => {
          setQuestions((prev) => prev.filter((_, i) => i !== currentQ));
          if (currentQ >= questions.length - 1 && currentQ > 0) {
            setCurrentQ(currentQ - 1);
          }
          setSelectedAnswer(null);
          setIsAnswered(false);
        }, 1500);
      }
    },
    [isAnswered, questions, currentQ, user]
  );

  const navigateTo = useCallback((idx: number) => {
    setCurrentQ(idx);
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, []);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">Loading review questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl text-center py-16">
          <div className="text-4xl mb-4">&#x1F389;</div>
          <div className="text-white font-semibold text-lg mb-2">
            No wrong answers to review!
          </div>
          <div className="text-cissp-text-muted text-sm mb-4">
            Take more quizzes to build your review queue.
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-cissp-teal hover:text-white transition-colors cursor-pointer"
          >
            Start practicing &rarr;
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const domain = q.domains;
  const color = domain?.color || "#6AB1C2";

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Wrong Answer Review</h1>
            <span className="text-xs text-cissp-text-muted">
              {questions.length} questions to review &bull; Q{currentQ + 1}
            </span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-cissp-card border border-cissp-border rounded-lg text-cissp-text-secondary px-3.5 py-2 text-[13px] cursor-pointer hover:bg-cissp-card-hover transition-colors"
          >
            &larr; Home
          </button>
        </div>

        {q.attempt_count > 1 && (
          <div className="bg-cissp-red/10 border border-cissp-red/30 rounded-lg px-4 py-2 mb-4 text-xs text-cissp-red">
            Missed {q.attempt_count} times
          </div>
        )}

        <QuestionCard
          question={q}
          domainColor={color}
          selectedAnswer={selectedAnswer}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
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
              currentQ < questions.length - 1 && navigateTo(currentQ + 1)
            }
            disabled={currentQ >= questions.length - 1}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${
              currentQ >= questions.length - 1
                ? "bg-white/[0.02] text-[#4A5A6A] cursor-default"
                : "text-white cursor-pointer"
            }`}
            style={
              currentQ < questions.length - 1
                ? { backgroundColor: color }
                : undefined
            }
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
