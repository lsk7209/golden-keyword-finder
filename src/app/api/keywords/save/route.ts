import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NaverKeyword } from '@/types/keyword';
import { parseNaverNumber } from '@/lib/naver/keywords';

export async function POST(request: NextRequest) {
  try {
    const keywordData: NaverKeyword = await request.json();

    if (!keywordData.keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 중복 체크
    const { data: existing } = await supabase
      .from('keywords')
      .select('id')
      .eq('keyword', keywordData.keyword)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('keywords')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          monthly_pc_qc_cnt: parseNaverNumber(keywordData.monthlyPcQcCnt),
          monthly_mobile_qc_cnt: parseNaverNumber(keywordData.monthlyMobileQcCnt),
          monthly_ave_pc_clk_cnt: parseFloat(keywordData.monthlyAvePcClkCnt) || 0,
          monthly_ave_mobile_clk_cnt: parseFloat(keywordData.monthlyAveMobileClkCnt) || 0,
          monthly_ave_pc_ctr: parseFloat(keywordData.monthlyAvePcCtr) || 0,
          monthly_ave_mobile_ctr: parseFloat(keywordData.monthlyAveMobileCtr) || 0,
          pl_avg_depth: parseNaverNumber(keywordData.plAvgDepth),
          comp_idx: keywordData.compIdx as '낮음' | '중간' | '높음',
          updated_at: now,
        } as any)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: { id: data.id, action: 'updated' },
      });
    } else {
      // 새로 삽입
      const { data, error } = await supabase
        .from('keywords')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          keyword: keywordData.keyword,
          monthly_pc_qc_cnt: parseNaverNumber(keywordData.monthlyPcQcCnt),
          monthly_mobile_qc_cnt: parseNaverNumber(keywordData.monthlyMobileQcCnt),
          monthly_ave_pc_clk_cnt: parseFloat(keywordData.monthlyAvePcClkCnt) || 0,
          monthly_ave_mobile_clk_cnt: parseFloat(keywordData.monthlyAveMobileClkCnt) || 0,
          monthly_ave_pc_ctr: parseFloat(keywordData.monthlyAvePcCtr) || 0,
          monthly_ave_mobile_ctr: parseFloat(keywordData.monthlyAveMobileCtr) || 0,
          pl_avg_depth: parseNaverNumber(keywordData.plAvgDepth),
          comp_idx: keywordData.compIdx as '낮음' | '중간' | '높음',
          blog_count: 0,
          cafe_count: 0,
          web_count: 0,
          news_count: 0,
          tags: [],
          is_favorite: false,
          created_at: now,
          updated_at: now,
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: { id: data.id, action: 'created' },
      });
    }

  } catch (error) {
    console.error('키워드 저장 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
