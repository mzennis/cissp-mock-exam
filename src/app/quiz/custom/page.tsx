"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizTopBar, QuizNav, LiveScore, QuestionMap } from "@/components/QuizChrome";
import { ButtonLink, EmptyState, Icons, LoadingState, PageContainer } from "@/components/ui";
import type { Question, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE, CUSTOM_QUIZ_COLOR } from "@/lib/constants";

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

  if (loading || authLoading) return <LoadingState label="Loading questions..." />;

  if (questions.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Icons.Upload />}
          title="No imported questions yet"
          description="Upload a JSON file of your own practice questions to build a custom quiz."
          action={
            <ButtonLink href="/import" variant="primary">
              Import questions
            </ButtonLink>
          }
        />
      </PageContainer>
    );
  }

  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;

  return (
    <PageContainer>
      <QuizTopBar onBack={() => router.push("/")} title="My Questions">
        <LiveScore
          correct={Object.values(answers).filter((a) => a.correct).length}
          answered={Object.keys(answers).length}
        />
      </QuizTopBar>

      <ProgressBar
        current={currentQ + 1}
        total={questions.length}
        color={CUSTOM_QUIZ_COLOR}
        label="Imported questions"
      />

      <QuestionCard
        question={q}
        domainColor={CUSTOM_QUIZ_COLOR}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        onAnswer={handleAnswer}
      />

      <QuizNav
        onPrev={() => navigateTo(currentQ - 1)}
        onNext={() => (isLast ? finishQuiz() : navigateTo(currentQ + 1))}
        prevDisabled={currentQ === 0}
        isFinal={isLast}
        nextLabel={isLast ? "Finish Quiz" : "Next"}
        color={CUSTOM_QUIZ_COLOR}
      />

      <QuestionMap
        total={questions.length}
        current={currentQ}
        isAnswered={(i) => !!answers[questions[i].id]}
        onSelect={navigateTo}
      />
    </PageContainer>
  );
}
