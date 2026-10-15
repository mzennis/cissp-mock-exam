"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, Icons } from "./ui";

export function QuizTopBar({
  onBack,
  backLabel = "Back",
  title,
  subtitle,
  children,
}: {
  onBack: () => void;
  backLabel?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button size="sm" onClick={onBack} aria-label={backLabel}>
          <Icons.ArrowLeft size={15} />
          <span className="hidden sm:inline">{backLabel}</span>
        </Button>
        {title && (
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white truncate">{title}</h1>
            {subtitle && <div className="text-xs text-cissp-text-muted">{subtitle}</div>}
          </div>
        )}
      </div>
      <div className="flex gap-2 sm:gap-3 items-center shrink-0">{children}</div>
    </div>
  );
}

export function LiveScore({ correct, answered }: { correct: number; answered: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-cissp-text-muted px-3 py-1.5 rounded-lg bg-cissp-card border border-cissp-border tabular-nums">
      <Icons.Check size={14} />
      <span className="text-cissp-text font-semibold">{correct}</span>/{answered}
      <span className="hidden sm:inline">correct</span>
    </span>
  );
}

export function QuizNav({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  nextLabel = "Next",
  isFinal = false,
  color,
  center,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  /** When true, the next button finishes the session and ArrowRight is ignored. */
  isFinal?: boolean;
  color?: string;
  center?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft" && !prevDisabled) onPrev();
      if (e.key === "ArrowRight" && !nextDisabled && !isFinal) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, prevDisabled, nextDisabled, isFinal]);

  return (
    <div className="flex justify-between items-center gap-3 pt-2">
      <Button onClick={onPrev} disabled={prevDisabled}>
        <Icons.ArrowLeft size={15} />
        Previous
      </Button>
      {center}
      <Button
        variant="primary"
        onClick={onNext}
        disabled={nextDisabled}
        style={color && !isFinal ? { backgroundColor: color } : undefined}
      >
        {nextLabel}
        {isFinal ? <Icons.Check size={15} /> : <Icons.ArrowRight size={15} />}
      </Button>
    </div>
  );
}

export function QuestionMap({
  total,
  current,
  isAnswered,
  isBookmarked,
  onSelect,
}: {
  total: number;
  current: number;
  isAnswered: (idx: number) => boolean;
  isBookmarked?: (idx: number) => boolean;
  onSelect: (idx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  let answeredCount = 0;
  for (let i = 0; i < total; i++) if (isAnswered(i)) answeredCount++;

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-cissp-card border border-cissp-border text-sm text-cissp-text-secondary hover:bg-cissp-card-hover transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Icons.Grid size={15} />
          Question map
        </span>
        <span className="text-xs text-cissp-text-muted tabular-nums">
          {answeredCount} of {total} answered · {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="mt-3 p-4 rounded-xl bg-cissp-card border border-cissp-border animate-fade-up">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5 max-h-72 overflow-y-auto pr-1">
            {Array.from({ length: total }, (_, i) => {
              const answered = isAnswered(i);
              const marked = isBookmarked?.(i);
              return (
                <button
                  key={i}
                  onClick={() => onSelect(i)}
                  className={`relative h-9 rounded-md text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                    i === current
                      ? "bg-cissp-teal text-cissp-dark"
                      : answered
                        ? "bg-cissp-teal/15 text-cissp-teal hover:bg-cissp-teal/25"
                        : "bg-white/[0.04] text-cissp-text-muted hover:bg-white/10"
                  }`}
                  aria-label={`Question ${i + 1}${answered ? ", answered" : ""}${marked ? ", bookmarked" : ""}`}
                  aria-current={i === current ? "step" : undefined}
                >
                  {i + 1}
                  {marked && (
                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-cissp-amber" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-cissp-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-cissp-teal/15 border border-cissp-teal/40" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-white/[0.04] border border-cissp-border" /> Unanswered
            </span>
            {isBookmarked && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cissp-amber" /> Bookmarked
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
