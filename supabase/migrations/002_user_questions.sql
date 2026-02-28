-- User-imported questions table

CREATE TABLE user_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id SMALLINT NOT NULL REFERENCES domains(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer SMALLINT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_questions_user_domain ON user_questions(user_id, domain_id);

ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_questions_select" ON user_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_questions_insert" ON user_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_questions_delete" ON user_questions FOR DELETE USING (auth.uid() = user_id);

-- Allow custom_quiz mode in exam_attempts
ALTER TABLE exam_attempts DROP CONSTRAINT exam_attempts_mode_check;
ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_mode_check CHECK (mode IN ('quiz', 'full_exam', 'custom_quiz'));
