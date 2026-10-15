"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizTopBar, QuizNav } from "@/components/QuizChrome";
import { ButtonLink, EmptyState, Icons, LoadingState, PageContainer, PageHeader } from "@/components/ui";
import { domainColor } from "@/lib/constants";
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

  if (loading || authLoading) return <LoadingState label="Loading review queue..." />;

  if (questions.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Review" subtitle="Questions you've answered incorrectly." />
        <EmptyState
          icon={<Icons.Check />}
          title="Your review queue is clear"
          description="Questions you miss in quizzes and exams appear here until you answer them correctly."
          action={
            <ButtonLink href="/" variant="primary">
              Start practicing
            </ButtonLink>
          }
        />
      </PageContainer>
    );
  }

  const q = questions[currentQ];
  const domain = q.domains;
  const color = domainColor(domain?.id);

  return (
    <PageContainer>
      <QuizTopBar
        onBack={() => router.push("/")}
        backLabel="Home"
        title="Review"
        subtitle={`${questions.length} question${questions.length === 1 ? "" : "s"} to master`}
      >
        {q.attempt_count > 1 && (
          <span className="text-xs font-semibold text-cissp-red bg-cissp-red/10 border border-cissp-red/30 rounded-lg px-3 py-1.5">
            Missed {q.attempt_count}×
          </span>
        )}
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
      />

      <QuizNav
        onPrev={() => navigateTo(currentQ - 1)}
        onNext={() => navigateTo(currentQ + 1)}
        prevDisabled={currentQ === 0}
        nextDisabled={currentQ >= questions.length - 1}
        color={color}
      />
    </PageContainer>
  );
}
