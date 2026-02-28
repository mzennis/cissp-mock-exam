-- CISSP Mock Exam App Schema

CREATE TABLE domains (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  weight TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id SMALLINT NOT NULL REFERENCES domains(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer SMALLINT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_questions_domain ON questions(domain_id);

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'full_exam')),
  domain_id SMALLINT REFERENCES domains(id),
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  score_pct SMALLINT NOT NULL,
  passed BOOLEAN NOT NULL,
  time_spent_seconds INT,
  domain_breakdown JSONB,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_attempts_user_created ON exam_attempts(user_id, created_at DESC);

CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);
CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);

CREATE TABLE user_wrong_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  last_selected SMALLINT NOT NULL,
  attempt_count SMALLINT DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);
CREATE INDEX idx_wrong_user ON user_wrong_answers(user_id);

-- RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wrong_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domains_public_read" ON domains FOR SELECT USING (true);
CREATE POLICY "questions_public_read" ON questions FOR SELECT USING (true);

CREATE POLICY "attempts_select" ON exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert" ON exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_select" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "wrong_select" ON user_wrong_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wrong_insert" ON user_wrong_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wrong_update" ON user_wrong_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wrong_delete" ON user_wrong_answers FOR DELETE USING (auth.uid() = user_id);
