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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isWarning = timeLeft < TIMER_WARNING_SECONDS;

  return (
    <span
      className={`text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-black/30 ${
        isWarning ? "text-cissp-red" : "text-cissp-teal"
      }`}
    >
      {formatted}
    </span>
  );
}
