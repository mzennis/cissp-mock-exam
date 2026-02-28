"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ExamTimer } from "@/components/ExamTimer";
import type { Question, Domain, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE, SECONDS_PER_QUESTION } from "@/lib/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const finishingRef = useRef(false);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: domainData }, { data: questionData }] = await Promise.all([
        supabase.from("domains").select("*").order("id"),
        supabase.from("questions").select("*"),
      ]);

      if (domainData) setDomains(domainData);
      if (questionData) {
        const shuffled = shuffle(questionData);
        setQuestions(shuffled);
        setTimeLeft(shuffled.length * SECONDS_PER_QUESTION);
        setTimerActive(true);
      }

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
  }, [user]);

  const getDomainForQuestion = useCallback(
    (q: Question) => domains.find((d) => d.id === q.domain_id),
    [domains]
  );

  const handleAnswer = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      const q = questions[currentQ];
      const correct = q.answer != null && idx === q.answer;
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

  const finishExam = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setTimerActive(false);

    const answerList = Object.values(answers);
    const correct = answerList.filter((a) => a.correct).length;
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Build domain breakdown
    const breakdown: Record<string, { total: number; correct: number; pct: number }> = {};
    for (const q of questions) {
      const d = getDomainForQuestion(q);
      if (!d) continue;
      if (!breakdown[d.name]) breakdown[d.name] = { total: 0, correct: 0, pct: 0 };
      const ans = answers[q.id];
      if (ans) {
        breakdown[d.name].total++;
        if (ans.correct) breakdown[d.name].correct++;
      }
    }
    for (const key of Object.keys(breakdown)) {
      const b = breakdown[key];
      b.pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
    }

    if (user) {
      const supabase = createClient();
      await supabase.from("exam_attempts").insert({
        user_id: user.id,
        mode: "full_exam",
        total_questions: total,
        correct_answers: correct,
        score_pct: pct,
        passed: pct >= PASSING_SCORE,
        time_spent_seconds: timeSpent,
        domain_breakdown: breakdown,
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
      mode: "full_exam",
      total,
      correct,
      pct,
      passed: pct >= PASSING_SCORE,
      timeSpent,
      domainBreakdown: breakdown,
    };
    sessionStorage.setItem("examResult", JSON.stringify(resultData));
    router.push("/results");
  }, [answers, questions, user, startTime, getDomainForQuestion, router]);

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
        <div className="text-cissp-text-muted">Loading exam...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">No questions available.</div>
      </div>
    );
  }

  const q = questions[currentQ];
  const domain = getDomainForQuestion(q);
  const color = domain?.color || "#6AB1C2";

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              setTimerActive(false);
              router.push("/");
            }}
            className="bg-cissp-card border border-cissp-border rounded-lg text-cissp-text-secondary px-3.5 py-2 text-[13px] cursor-pointer hover:bg-cissp-card-hover transition-colors"
          >
            &larr; Back
          </button>
          <div className="flex gap-4 items-center">
            <ExamTimer
              timeLeft={timeLeft}
              onTick={() => setTimeLeft((t) => t - 1)}
              onTimeUp={finishExam}
              active={timerActive}
            />
            <span className="text-[13px] text-cissp-text-muted">
              {Object.values(answers).filter((a) => a.correct).length}/
              {Object.keys(answers).length} correct
            </span>
          </div>
        </div>

        <ProgressBar
          current={currentQ + 1}
          total={questions.length}
          color={color}
          label={
            domain
              ? `Domain ${domain.id}: ${domain.name}`
              : undefined
          }
        />

        <QuestionCard
          question={q}
          domainColor={color}
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
                ? finishExam()
                : navigateTo(currentQ + 1)
            }
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: color }}
          >
            {currentQ === questions.length - 1 ? "Finish Exam \u2192" : "Next \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
