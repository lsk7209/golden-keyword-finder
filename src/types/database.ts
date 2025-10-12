export interface Database {
  public: {
    Tables: {
      keywords: {
        Row: {
          id: string;
          keyword: string;
          monthly_pc_qc_cnt: number;
          monthly_mobile_qc_cnt: number;
          total_search_volume: number;
          monthly_ave_pc_clk_cnt: number;
          monthly_ave_mobile_clk_cnt: number;
          monthly_ave_pc_ctr: number;
          monthly_ave_mobile_ctr: number;
          pl_avg_depth: number;
          comp_idx: '낮음' | '중간' | '높음';
          blog_count: number;
          cafe_count: number;
          web_count: number;
          news_count: number;
          total_doc_count: number;
          golden_score: number;
          tags: string[];
          notes: string | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
          last_checked_at: string | null;
        };
        Insert: {
          id?: string;
          keyword: string;
          monthly_pc_qc_cnt?: number;
          monthly_mobile_qc_cnt?: number;
          monthly_ave_pc_clk_cnt?: number;
          monthly_ave_mobile_clk_cnt?: number;
          monthly_ave_pc_ctr?: number;
          monthly_ave_mobile_ctr?: number;
          pl_avg_depth?: number;
          comp_idx?: '낮음' | '중간' | '높음';
          blog_count?: number;
          cafe_count?: number;
          web_count?: number;
          news_count?: number;
          tags?: string[];
          notes?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          last_checked_at?: string | null;
        };
        Update: {
          id?: string;
          keyword?: string;
          monthly_pc_qc_cnt?: number;
          monthly_mobile_qc_cnt?: number;
          monthly_ave_pc_clk_cnt?: number;
          monthly_ave_mobile_clk_cnt?: number;
          monthly_ave_pc_ctr?: number;
          monthly_ave_mobile_ctr?: number;
          pl_avg_depth?: number;
          comp_idx?: '낮음' | '중간' | '높음';
          blog_count?: number;
          cafe_count?: number;
          web_count?: number;
          news_count?: number;
          tags?: string[];
          notes?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          last_checked_at?: string | null;
        };
      };
      search_history: {
        Row: {
          id: string;
          seed_keyword: string;
          searched_at: string;
          result_count: number;
          found_keywords: string[];
          user_id: string | null;
          ip_address: string | null;
          search_options: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          seed_keyword: string;
          searched_at?: string;
          result_count?: number;
          found_keywords?: string[];
          user_id?: string | null;
          ip_address?: string | null;
          search_options?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          seed_keyword?: string;
          searched_at?: string;
          result_count?: number;
          found_keywords?: string[];
          user_id?: string | null;
          ip_address?: string | null;
          search_options?: Record<string, unknown>;
        };
      };
      document_fetch_logs: {
        Row: {
          id: string;
          keyword_id: string;
          fetched_at: string;
          blog_count: number | null;
          cafe_count: number | null;
          web_count: number | null;
          news_count: number | null;
          api_response_time: number | null;
          status: string;
        };
        Insert: {
          id?: string;
          keyword_id: string;
          fetched_at?: string;
          blog_count?: number | null;
          cafe_count?: number | null;
          web_count?: number | null;
          news_count?: number | null;
          api_response_time?: number | null;
          status?: string;
        };
        Update: {
          id?: string;
          keyword_id?: string;
          fetched_at?: string;
          blog_count?: number | null;
          cafe_count?: number | null;
          web_count?: number | null;
          news_count?: number | null;
          api_response_time?: number | null;
          status?: string;
        };
      };
    };
  };
}
