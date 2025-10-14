-- 자동 수집 세션 테이블 생성
CREATE TABLE IF NOT EXISTS auto_collect_sessions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running',
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  current_seed_keywords TEXT[] DEFAULT '{}',
  used_seed_keywords TEXT[] DEFAULT '{}',
  message TEXT DEFAULT '',
  logs TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_auto_collect_sessions_status ON auto_collect_sessions(status);
CREATE INDEX IF NOT EXISTS idx_auto_collect_sessions_created_at ON auto_collect_sessions(created_at);

-- RLS 정책 설정 (모든 사용자가 접근 가능하도록)
ALTER TABLE auto_collect_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on auto_collect_sessions" ON auto_collect_sessions
  FOR ALL USING (true) WITH CHECK (true);
