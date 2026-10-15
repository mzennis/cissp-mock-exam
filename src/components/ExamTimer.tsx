"use client";

import { useEffect, useRef } from "react";
import { TIMER_WARNING_SECONDS } from "@/lib/constants";

interface ExamTimerProps {
  timeLeft: number;
  onTick: () => void;
  onTimeUp: () => void;
  active: boolean;
}

export function ExamTimer({ timeLeft, onTick, onTimeUp, active }: ExamTimerProps) {
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (active && timeLeft > 0) {
      timerRef.current = setInterval(onTick, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timeLeft <= 0 && active) {
      onTimeUp();
    }
  }, [active, timeLeft, onTick, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const isWarning = timeLeft < TIMER_WARNING_SECONDS;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums px-3 py-1.5 rounded-lg border ${
        isWarning
          ? "text-cissp-red bg-cissp-red/10 border-cissp-red/30"
          : "text-cissp-teal bg-cissp-teal/[0.08] border-cissp-teal/20"
      }`}
      role="timer"
      aria-label="Time remaining"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      {formatted}
    </span>
  );
}
