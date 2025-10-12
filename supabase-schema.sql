-- 황금키워드 파인더 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. keywords 테이블 생성
CREATE TABLE keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE,
  
  -- 검색량 데이터
  monthly_pc_qc_cnt INTEGER DEFAULT 0,
  monthly_mobile_qc_cnt INTEGER DEFAULT 0,
  total_search_volume INTEGER GENERATED ALWAYS AS 
    (monthly_pc_qc_cnt + monthly_mobile_qc_cnt) STORED,
  
  -- 클릭 데이터
  monthly_ave_pc_clk_cnt DECIMAL(10,2) DEFAULT 0,
  monthly_ave_mobile_clk_cnt DECIMAL(10,2) DEFAULT 0,
  
  -- CTR 데이터
  monthly_ave_pc_ctr DECIMAL(5,2) DEFAULT 0,
  monthly_ave_mobile_ctr DECIMAL(5,2) DEFAULT 0,
  
  -- 경쟁 데이터
  pl_avg_depth INTEGER DEFAULT 0,
  comp_idx VARCHAR(10) CHECK (comp_idx IN ('낮음', '중간', '높음')),
  
  -- 문서수 데이터
  blog_count INTEGER DEFAULT 0,
  cafe_count INTEGER DEFAULT 0,
  web_count INTEGER DEFAULT 0,
  news_count INTEGER DEFAULT 0,
  total_doc_count INTEGER GENERATED ALWAYS AS 
    (blog_count + cafe_count + web_count + news_count) STORED,
  
  -- 황금점수 (자동 계산)
  golden_score DECIMAL(10,2) GENERATED ALWAYS AS 
    (CASE 
      WHEN (blog_count + cafe_count + web_count + news_count) > 0 THEN 
        CAST(total_search_volume AS DECIMAL) / (blog_count + cafe_count + web_count + news_count)
      ELSE 999.99 
    END) STORED,
  
  -- 메타 데이터
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ
);

-- 2. search_history 테이블 생성
CREATE TABLE search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_keyword VARCHAR(255) NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  result_count INTEGER DEFAULT 0,
  found_keywords TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  search_options JSONB DEFAULT '{}'::jsonb
);

-- 3. document_fetch_logs 테이블 생성
CREATE TABLE document_fetch_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  blog_count INTEGER,
  cafe_count INTEGER,
  web_count INTEGER,
  news_count INTEGER,
  api_response_time INTEGER, -- milliseconds
  status VARCHAR(20) DEFAULT 'success'
);

-- 4. 인덱스 생성
CREATE INDEX idx_keywords_golden_score ON keywords(golden_score DESC);
CREATE INDEX idx_keywords_search_volume ON keywords(total_search_volume DESC);
CREATE INDEX idx_keywords_created_at ON keywords(created_at DESC);
CREATE INDEX idx_keywords_comp_idx ON keywords(comp_idx);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_keywords_is_favorite ON keywords(is_favorite);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_date ON search_history(searched_at DESC);
CREATE INDEX idx_search_history_seed_keyword ON search_history(seed_keyword);

CREATE INDEX idx_document_fetch_logs_keyword ON document_fetch_logs(keyword_id);
CREATE INDEX idx_document_fetch_logs_date ON document_fetch_logs(fetched_at DESC);

-- 5. Row Level Security (RLS) 정책
-- Enable RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_fetch_logs ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 (인증 없이도 조회 가능)
CREATE POLICY "Public read access on keywords" ON keywords
  FOR SELECT USING (true);

CREATE POLICY "Public read access on search_history" ON search_history
  FOR SELECT USING (true);

CREATE POLICY "Public read access on document_fetch_logs" ON document_fetch_logs
  FOR SELECT USING (true);

-- 인증된 사용자만 쓰기
CREATE POLICY "Authenticated users can insert keywords" ON keywords
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update keywords" ON keywords
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete keywords" ON keywords
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert search_history" ON search_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert document_fetch_logs" ON document_fetch_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
CREATE TRIGGER update_keywords_updated_at 
    BEFORE UPDATE ON keywords 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. 샘플 데이터 삽입 (선택사항)
INSERT INTO keywords (
  keyword, 
  monthly_pc_qc_cnt, 
  monthly_mobile_qc_cnt, 
  monthly_ave_pc_ctr, 
  monthly_ave_mobile_ctr, 
  pl_avg_depth, 
  comp_idx,
  blog_count,
  cafe_count,
  web_count,
  news_count,
  tags,
  is_favorite
) VALUES 
(
  '마케팅', 
  10000, 
  15000, 
  2.5, 
  3.2, 
  15, 
  '높음',
  50000,
  30000,
  200000,
  5000,
  ARRAY['마케팅', '비즈니스'],
  false
),
(
  'SEO 최적화', 
  5000, 
  8000, 
  3.1, 
  4.2, 
  8, 
  '중간',
  20000,
  null,
  80000,
  1000,
  ARRAY['SEO', '웹개발'],
  true
),
(
  '블로그 운영', 
  3000, 
  5000, 
  4.5, 
  5.8, 
  5, 
  '낮음',
  15000,
  10000,
  60000,
  500,
  ARRAY['블로그', '콘텐츠'],
  false
);

-- 9. 뷰 생성 (황금키워드 랭킹)
CREATE VIEW golden_keywords_ranking AS
SELECT 
  keyword,
  total_search_volume,
  total_doc_count,
  golden_score,
  comp_idx,
  created_at,
  RANK() OVER (ORDER BY golden_score DESC) as rank
FROM keywords 
WHERE total_doc_count > 0
ORDER BY golden_score DESC;

-- 10. 통계 뷰 생성
CREATE VIEW keyword_stats AS
SELECT 
  COUNT(*) as total_keywords,
  COUNT(CASE WHEN golden_score >= 50 THEN 1 END) as golden_keywords,
  COUNT(CASE WHEN comp_idx = '낮음' THEN 1 END) as low_competition_keywords,
  AVG(golden_score) as avg_golden_score,
  MAX(golden_score) as max_golden_score,
  AVG(total_search_volume) as avg_search_volume,
  MAX(total_search_volume) as max_search_volume
FROM keywords;

-- 완료 메시지
SELECT 'Database schema created successfully!' as message;
