"use client";

import { useEffect } from "react";
import type { Question } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";
import { Icons } from "./ui";

interface QuestionCardProps {
  question: Question;
  domainColor: string;
  selectedAnswer: number | null;
  isAnswered: boolean;
  onAnswer: (idx: number) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  showBookmark?: boolean;
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

export function QuestionCard({
  question,
  domainColor,
  selectedAnswer,
  isAnswered,
  onAnswer,
  isBookmarked = false,
  onToggleBookmark,
  showBookmark = false,
}: QuestionCardProps) {
  // Keyboard shortcuts: A-F or 1-6 to pick an option
  useEffect(() => {
    if (isAnswered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      let idx = -1;
      if (key >= "a" && key <= "f") idx = key.charCodeAt(0) - 97;
      else if (key >= "1" && key <= "6") idx = Number(key) - 1;
      if (idx >= 0 && idx < question.options.length) {
        e.preventDefault();
        onAnswer(idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAnswered, question.options.length, onAnswer]);

  const hasKey = question.answer != null;
  const isCorrect = isAnswered && hasKey && selectedAnswer === question.answer;

  return (
    <div key={question.id} className="animate-fade-up">
      <div
        className="relative bg-cissp-surface/70 border border-cissp-border rounded-2xl p-6 sm:p-8 mb-4 overflow-hidden"
      >
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: domainColor }}
          aria-hidden="true"
        />
        <p className="text-[17px] sm:text-lg font-medium leading-relaxed text-cissp-text pr-10">
          {question.question}
        </p>
        {showBookmark && onToggleBookmark && (
          <div className="absolute top-4 right-4">
            <BookmarkButton isBookmarked={isBookmarked} onClick={onToggleBookmark} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-5" role="group" aria-label="Answer options">
        {question.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let state: "idle" | "correct" | "wrong" | "chosen" | "dimmed" = "idle";

          if (isAnswered) {
            if (hasKey && i === question.answer) state = "correct";
            else if (i === selectedAnswer) state = hasKey ? "wrong" : "chosen";
            else state = "dimmed";
          }

          const styles = {
            idle: "bg-cissp-card border-cissp-border text-cissp-text hover:bg-cissp-card-hover hover:border-cissp-teal/40 cursor-pointer",
            correct: "bg-cissp-green/10 border-cissp-green/50 text-cissp-green-light",
            wrong: "bg-cissp-red/10 border-cissp-red/50 text-cissp-red-light",
            chosen: "bg-cissp-teal/10 border-cissp-teal/50 text-cissp-text",
            dimmed: "bg-cissp-card border-cissp-border text-cissp-text-muted",
          }[state];

          const indicatorStyles = {
            idle: "bg-white/[0.06] border-cissp-border text-cissp-text-secondary group-hover:border-cissp-teal/50 group-hover:text-cissp-teal",
            correct: "bg-cissp-green/20 border-cissp-green/50 text-cissp-green",
            wrong: "bg-cissp-red/20 border-cissp-red/50 text-cissp-red",
            chosen: "bg-cissp-teal/20 border-cissp-teal/50 text-cissp-teal",
            dimmed: "bg-white/[0.03] border-cissp-border text-cissp-text-dim",
          }[state];

          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={isAnswered}
              className={`group flex items-start gap-3.5 p-3.5 sm:p-4 border rounded-xl text-[15px] text-left leading-relaxed transition-all disabled:cursor-default ${styles}`}
            >
              <span
                className={`min-w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] font-bold shrink-0 transition-colors ${indicatorStyles}`}
              >
                {state === "correct" ? (
                  <Icons.Check size={15} />
                ) : state === "wrong" ? (
                  <Icons.X size={15} />
                ) : (
                  letter
                )}
              </span>
              <span className="pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && hasKey && (
        <div
          className={`flex items-center gap-2 text-sm font-semibold mb-3 ${
            isCorrect ? "text-cissp-green" : "text-cissp-red"
          }`}
        >
          {isCorrect ? <Icons.Check size={16} /> : <Icons.X size={16} />}
          {isCorrect ? "Correct" : `Incorrect — the answer is ${String.fromCharCode(65 + question.answer!)}`}
        </div>
      )}

      {isAnswered && question.explanation && (
        <div className="bg-cissp-teal/[0.06] border border-cissp-teal/20 rounded-2xl p-5 mb-5 animate-fade-up">
          <div className="flex items-center gap-2 text-[11px] font-bold text-cissp-teal uppercase tracking-[0.12em] mb-2">
            <Icons.Lightbulb size={14} />
            Explanation
          </div>
          <p className="text-sm leading-relaxed text-cissp-text-secondary">
            {question.explanation}
          </p>
        </div>
      )}

      {!isAnswered && (
        <p className="hidden sm:block text-[11px] text-cissp-text-dim mb-4">
          Tip: press <kbd className="px-1 rounded border border-cissp-border">A</kbd>–
          <kbd className="px-1 rounded border border-cissp-border">
            {String.fromCharCode(64 + question.options.length)}
          </kbd>{" "}
          to answer, <kbd className="px-1 rounded border border-cissp-border">←</kbd>{" "}
          <kbd className="px-1 rounded border border-cissp-border">→</kbd> to navigate
        </p>
      )}
    </div>
  );
}
