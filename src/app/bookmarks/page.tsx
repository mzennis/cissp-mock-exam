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

interface BookmarkedQuestion extends Question {
  domains: Domain;
}

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<BookmarkedQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: bookmarkData } = await supabase
      .from("user_bookmarks")
      .select("question_id, questions(*, domains:domain_id(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (bookmarkData) {
      const qs = bookmarkData
        .map((b: Record<string, unknown>) => b.questions as BookmarkedQuestion)
        .filter(Boolean);
      setQuestions(qs);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) loadBookmarks();
  }, [user, authLoading, router, loadBookmarks]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      setSelectedAnswer(idx);
      setIsAnswered(true);
      setAnswered((prev) => ({ ...prev, [questions[currentQ].id]: idx }));
    },
    [isAnswered, questions, currentQ]
  );

  const navigateTo = useCallback(
    (idx: number) => {
      setCurrentQ(idx);
      const existing = answered[questions[idx]?.id];
      setSelectedAnswer(existing ?? null);
      setIsAnswered(existing !== undefined);
    },
    [questions, answered]
  );

  const removeBookmark = useCallback(
    async (questionId: string) => {
      if (!user) return;
      const supabase = createClient();
      await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (currentQ >= questions.length - 1 && currentQ > 0) {
        navigateTo(currentQ - 1);
      }
    },
    [user, questions, currentQ, navigateTo]
  );

  if (loading || authLoading) return <LoadingState label="Loading bookmarks..." />;

  if (questions.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Bookmarks" subtitle="Questions you've saved for later." />
        <EmptyState
          icon={<Icons.Bookmark />}
          title="No bookmarked questions"
          description="Tap the bookmark icon on any question during a quiz to save it here."
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
        title="Bookmarks"
        subtitle={`${questions.length} saved question${questions.length === 1 ? "" : "s"}`}
      />

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
        isBookmarked={true}
        onToggleBookmark={() => removeBookmark(q.id)}
        showBookmark={true}
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
