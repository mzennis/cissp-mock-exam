"use client";

import type { Question } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";

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
  return (
    <div>
      <div className="bg-white/5 border border-cissp-border rounded-xl p-7 mb-4 relative">
        <p className="text-[17px] font-medium leading-relaxed text-cissp-text">
          {question.question}
        </p>
        {showBookmark && onToggleBookmark && (
          <div className="absolute top-4 right-4">
            <BookmarkButton
              isBookmarked={isBookmarked}
              onClick={onToggleBookmark}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-5">
        {question.options.map((opt, i) => {
          let bg = "bg-cissp-card";
          let border = "border-cissp-border";
          let text = "text-[#D0D0D0]";
          let indicator = String.fromCharCode(65 + i);
          let indicatorBg = "bg-white/[0.08]";
          let indicatorText = "text-cissp-text-secondary";

          if (isAnswered) {
            if (question.answer != null && i === question.answer) {
              bg = "bg-cissp-green/[0.12]";
              border = "border-cissp-green/40";
              text = "text-cissp-green-light";
              indicatorBg = "bg-cissp-green/30";
              indicatorText = "text-cissp-green-light";
              indicator = "\u2713";
            } else if (i === selectedAnswer && (question.answer == null || i !== question.answer)) {
              if (question.answer != null) {
                bg = "bg-cissp-red/[0.12]";
                border = "border-cissp-red/40";
                text = "text-cissp-red-light";
                indicatorBg = "bg-cissp-red/30";
                indicatorText = "text-cissp-red-light";
                indicator = "\u2717";
              } else {
                bg = "bg-white/[0.08]";
                border = "border-cissp-text-muted/30";
                text = "text-cissp-text";
              }
            }
          }

          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={isAnswered}
              className={`flex items-start gap-3.5 p-3.5 ${bg} border ${border} rounded-lg ${text} text-[15px] text-left leading-relaxed transition-all ${
                !isAnswered
                  ? "cursor-pointer hover:bg-cissp-card-hover"
                  : "cursor-default"
              }`}
              style={
                !isAnswered
                  ? {}
                  : undefined
              }
            >
              <span
                className={`min-w-7 h-7 flex items-center justify-center rounded-md ${indicatorBg} ${indicatorText} text-[13px] font-bold shrink-0`}
              >
                {indicator}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && question.explanation && (
        <div className="bg-cissp-teal/[0.08] border border-cissp-teal/20 rounded-xl p-5 mb-5">
          <div className="text-[11px] font-bold text-cissp-teal uppercase tracking-[0.1em] mb-2">
            Explanation
          </div>
          <p className="text-sm leading-relaxed text-[#B0C8D4]">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
