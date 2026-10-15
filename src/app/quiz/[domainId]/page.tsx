"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizTopBar, QuizNav, LiveScore, QuestionMap } from "@/components/QuizChrome";
import { ButtonLink, EmptyState, Icons, LoadingState, PageContainer } from "@/components/ui";
import type { Question, Domain, AnswerRecord } from "@/lib/types";
import { PASSING_SCORE, domainColor } from "@/lib/constants";

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

  if (loading) return <LoadingState label="Loading questions..." />;

  if (!domain || questions.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Icons.File />}
          title="No questions found"
          description="This domain doesn't have any questions yet."
          action={<ButtonLink href="/">Back to domains</ButtonLink>}
        />
      </PageContainer>
    );
  }

  const q = questions[currentQ];
  const color = domainColor(domain.id);
  const isLast = currentQ === questions.length - 1;

  return (
    <PageContainer>
      <QuizTopBar onBack={() => router.push("/")} title={`Domain ${domain.id} Quiz`}>
        <LiveScore
          correct={Object.values(answers).filter((a) => a.correct).length}
          answered={Object.keys(answers).length}
        />
      </QuizTopBar>

      <ProgressBar
        current={currentQ + 1}
        total={questions.length}
        color={color}
        label={domain.name}
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
        onNext={() => (isLast ? finishQuiz() : navigateTo(currentQ + 1))}
        prevDisabled={currentQ === 0}
        isFinal={isLast}
        nextLabel={isLast ? "Finish Quiz" : "Next"}
        color={color}
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
