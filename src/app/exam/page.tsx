"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ExamTimer } from "@/components/ExamTimer";
import { QuizTopBar, QuizNav, LiveScore, QuestionMap } from "@/components/QuizChrome";
import { Button, EmptyState, Icons, LoadingState, PageContainer } from "@/components/ui";
import type { Question, Domain, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE, SECONDS_PER_QUESTION, domainColor } from "@/lib/constants";

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

  const tick = useCallback(() => setTimeLeft((t) => t - 1), []);

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

  if (loading) return <LoadingState label="Preparing your exam..." />;

  if (questions.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Icons.File />}
          title="No questions available"
          description="The question bank is empty. Seed the database and try again."
        />
      </PageContainer>
    );
  }

  const q = questions[currentQ];
  const domain = getDomainForQuestion(q);
  const color = domainColor(domain?.id);
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const isLast = currentQ === questions.length - 1;

  return (
    <PageContainer>
      <QuizTopBar
        onBack={() => {
          setTimerActive(false);
          router.push("/");
        }}
        backLabel="Exit"
        title="Full Mock Exam"
      >
        <ExamTimer
          timeLeft={timeLeft}
          onTick={tick}
          onTimeUp={finishExam}
          active={timerActive}
        />
        <LiveScore correct={correctCount} answered={answeredCount} />
      </QuizTopBar>

      <ProgressBar
        current={currentQ + 1}
        total={questions.length}
        color={color}
        label={domain ? `Domain ${domain.id} · ${domain.name}` : undefined}
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

      <QuizNav
        onPrev={() => navigateTo(currentQ - 1)}
        onNext={() => (isLast ? finishExam() : navigateTo(currentQ + 1))}
        prevDisabled={currentQ === 0}
        isFinal={isLast}
        nextLabel={isLast ? "Finish Exam" : "Next"}
        color={color}
        center={
          !isLast && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                const unanswered = questions.length - answeredCount;
                if (window.confirm(`Submit the exam now? ${unanswered} unanswered question${unanswered === 1 ? "" : "s"} will be marked incorrect.`)) {
                  finishExam();
                }
              }}
            >
              Submit early
            </Button>
          )
        }
      />

      <QuestionMap
        total={questions.length}
        current={currentQ}
        isAnswered={(i) => !!answers[questions[i].id]}
        isBookmarked={user ? (i) => bookmarks.has(questions[i].id) : undefined}
        onSelect={navigateTo}
      />
    </PageContainer>
  );
}
