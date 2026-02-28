"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { QuestionCard } from "@/components/QuestionCard";
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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">Loading bookmarks...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl text-center py-16">
          <div className="text-cissp-text-muted mb-4">
            No bookmarked questions.
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
            <h1 className="text-xl font-bold text-white">Bookmarked Questions</h1>
            <span className="text-xs text-cissp-text-muted">
              {currentQ + 1} of {questions.length}
            </span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-cissp-card border border-cissp-border rounded-lg text-cissp-text-secondary px-3.5 py-2 text-[13px] cursor-pointer hover:bg-cissp-card-hover transition-colors"
          >
            &larr; Home
          </button>
        </div>

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
