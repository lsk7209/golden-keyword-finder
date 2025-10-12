import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // 테스트 키워드 데이터
    const testKeyword = {
      keyword: '테스트키워드_' + Date.now(),
      monthly_pc_qc_cnt: 1000,
      monthly_mobile_qc_cnt: 1500,
      monthly_ave_pc_clk_cnt: 10.5,
      monthly_ave_mobile_clk_cnt: 15.2,
      monthly_ave_pc_ctr: 2.5,
      monthly_ave_mobile_ctr: 3.2,
      pl_avg_depth: 8,
      comp_idx: '중간' as const,
      blog_count: 100,
      cafe_count: 50,
      web_count: 200,
      news_count: 10,
      tags: ['테스트'],
      is_favorite: false,
    };

    console.log('테스트 키워드 저장 시작:', testKeyword.keyword);

    const { data, error } = await supabase
      .from('keywords')
      .insert(testKeyword)
      .select()
      .single();

    if (error) {
      console.error('키워드 저장 오류:', error);
      return NextResponse.json({
        success: false,
        error: '키워드 저장 실패',
        details: error.message
      });
    }

    console.log('테스트 키워드 저장 성공:', data);

    // 저장된 키워드 조회 테스트
    const { data: savedKeywords, error: fetchError } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('키워드 조회 오류:', fetchError);
      return NextResponse.json({
        success: false,
        error: '키워드 조회 실패',
        details: fetchError.message
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        savedKeyword: data,
        totalKeywords: savedKeywords?.length || 0,
        recentKeywords: savedKeywords || [],
        message: '테스트 키워드 저장 및 조회 성공'
      }
    });

  } catch (error) {
    console.error('테스트 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '테스트 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
}
