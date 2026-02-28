"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { Question, Domain, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE } from "@/lib/constants";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const domainId = Number(params.domainId);

  const [domain, setDomain] = useState<Domain | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: domainData }, { data: questionData }] = await Promise.all([
        supabase.from("domains").select("*").eq("id", domainId).single(),
        supabase
          .from("questions")
          .select("*")
          .eq("domain_id", domainId)
          .order("created_at"),
      ]);

      if (domainData) setDomain(domainData);
      if (questionData) setQuestions(questionData);

      if (user) {
        const { data: bookmarkData } = await supabase
          .from("user_bookmarks")
          .select("question_id")
          .eq("user_id", user.id);
        if (bookmarkData) {
          setBookmarks(new Set(bookmarkData.map((b) => b.question_id)));
        }
      }

      setLoading(false);
    }

    load();
  }, [domainId, user]);

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
        mode: "quiz",
        domain_id: domainId,
        total_questions: total,
        correct_answers: correct,
        score_pct: pct,
        passed: pct >= PASSING_SCORE,
        answers: answerList,
      });

      const wrongAnswers = answerList.filter((a) => !a.correct);
      for (const wa of wrongAnswers) {
        await supabase.from("user_wrong_answers").upsert(
          {
            user_id: user.id,
            question_id: wa.question_id,
            last_selected: wa.selected,
            attempt_count: 1,
            last_attempt_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" }
        );
      }

      const correctIds = answerList
        .filter((a) => a.correct)
        .map((a) => a.question_id);
      if (correctIds.length > 0) {
        await supabase
          .from("user_wrong_answers")
          .delete()
          .eq("user_id", user.id)
          .in("question_id", correctIds);
      }
    }

    const resultData = {
      mode: "quiz",
      domainId,
      domainName: domain?.name,
      total: questions.length,
      correct,
      pct,
      passed: pct >= PASSING_SCORE,
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    router.push("/results");
  }, [answers, questions, user, domainId, domain, router]);

  const toggleBookmark = useCallback(
    async (questionId: string) => {
      if (!user) return;
      const supabase = createClient();
      const isBookmarked = bookmarks.has(questionId);

      if (isBookmarked) {
        await supabase
          .from("user_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
        setBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
      } else {
        await supabase.from("user_bookmarks").insert({
          user_id: user.id,
          question_id: questionId,
        });
        setBookmarks((prev) => new Set(prev).add(questionId));
      }
    },
    [user, bookmarks]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">Loading questions...</div>
      </div>
    );
  }

  if (!domain || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">No questions found for this domain.</div>
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
          color={domain.color}
          label={`Domain ${domain.id}: ${domain.name}`}
        />

        <QuestionCard
          question={q}
          domainColor={domain.color}
          selectedAnswer={selectedAnswer}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
          isBookmarked={bookmarks.has(q.id)}
          onToggleBookmark={() => toggleBookmark(q.id)}
          showBookmark={!!user}
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
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: domain.color }}
          >
            {currentQ === questions.length - 1 ? "Finish Quiz \u2192" : "Next \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
