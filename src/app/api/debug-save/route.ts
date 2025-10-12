import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('=== 디버그 저장 테스트 시작 ===');
    
    const supabase = await createClient();
    console.log('Supabase 클라이언트 생성 완료');

    // 간단한 테스트 데이터
    const testData = {
      keyword: `테스트키워드_${Date.now()}`,
      monthly_pc_qc_cnt: 1000,
      monthly_mobile_qc_cnt: 1500,
      monthly_ave_pc_clk_cnt: 10.5,
      monthly_ave_mobile_clk_cnt: 15.2,
      monthly_ave_pc_ctr: 2.5,
      monthly_ave_mobile_ctr: 3.2,
      pl_avg_depth: 8,
      comp_idx: '중간',
      blog_count: 100,
      cafe_count: 50,
      web_count: 200,
      news_count: 10,
      tags: ['테스트'],
      is_favorite: false,
    };

    console.log('테스트 데이터:', testData);

    // 중복 체크
    console.log('중복 체크 시작...');
    const { data: existing, error: checkError } = await supabase
      .from('keywords')
      .select('id')
      .eq('keyword', testData.keyword)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('중복 체크 오류:', checkError);
      return NextResponse.json({
        success: false,
        error: '중복 체크 실패',
        details: checkError.message,
        code: checkError.code
      });
    }

    console.log('중복 체크 완료, existing:', existing);

    const now = new Date().toISOString();

    if (existing) {
      console.log('기존 키워드 업데이트 시도...');
      const { data, error } = await supabase
        .from('keywords')
        .update({
          monthly_pc_qc_cnt: testData.monthly_pc_qc_cnt,
          monthly_mobile_qc_cnt: testData.monthly_mobile_qc_cnt,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('업데이트 오류:', error);
        return NextResponse.json({
          success: false,
          error: '업데이트 실패',
          details: error.message,
          code: error.code
        });
      }

      console.log('업데이트 성공:', data);
      return NextResponse.json({
        success: true,
        action: 'updated',
        data: data
      });
    } else {
      console.log('새 키워드 삽입 시도...');
      const { data, error } = await supabase
        .from('keywords')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('삽입 오류:', error);
        return NextResponse.json({
          success: false,
          error: '삽입 실패',
          details: error.message,
          code: error.code,
          hint: error.hint
        });
      }

      console.log('삽입 성공:', data);
      return NextResponse.json({
        success: true,
        action: 'created',
        data: data
      });
    }

  } catch (error) {
    console.error('=== 디버그 저장 테스트 오류 ===', error);
    
    return NextResponse.json({
      success: false,
      error: '예상치 못한 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
