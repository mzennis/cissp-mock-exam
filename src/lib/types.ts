export interface Domain {
  id: number;
  name: string;
  weight: string;
  color: string;
  question_count?: number;
}

export interface Question {
  id: string;
  domain_id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface AnswerRecord {
  question_id: string;
  selected: number;
  correct: boolean;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  mode: "quiz" | "full_exam";
  domain_id: number | null;
  total_questions: number;
  correct_answers: number;
  score_pct: number;
  passed: boolean;
  time_spent_seconds: number | null;
  domain_breakdown: Record<
    string,
    { total: number; correct: number; pct: number }
  > | null;
  answers: AnswerRecord[];
  created_at: string;
}

export interface UserBookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
  questions?: Question;
}

export interface UserWrongAnswer {
  id: string;
  user_id: string;
  question_id: string;
  last_selected: number;
  attempt_count: number;
  last_attempt_at: string;
  questions?: Question;
}
