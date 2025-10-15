/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NaverKeyword } from '@/types/keyword';
import { parseNaverNumber } from '@/lib/naver/keywords';
import { getDocumentCounts, NaverApiUsageMonitor } from '@/lib/naver/documents';

export async function POST(request: NextRequest) {
  let keywordData: NaverKeyword | null = null;
  
  try {
    // 환경변수 확인
    console.log('환경변수 확인:', {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정',
    });

    keywordData = await request.json();
    
    console.log('키워드 저장 요청:', {
      keyword: keywordData?.keyword,
      monthlyPcQcCnt: keywordData?.monthlyPcQcCnt,
      monthlyMobileQcCnt: keywordData?.monthlyMobileQcCnt,
      compIdx: keywordData?.compIdx
    });

    if (!keywordData?.keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Supabase 클라이언트 생성 시작...');
    const supabase = await createClient();
    console.log('Supabase 클라이언트 생성 완료');

    // 중복 체크
    const { data: existing, error: checkError } = await supabase
      .from('keywords')
      .select('id')
      .eq('keyword', keywordData!.keyword)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('중복 체크 오류:', checkError);
      throw checkError;
    }

    const now = new Date().toISOString();

    // 문서수 자동 수집
    let documentCounts = {
      blogCount: 0,
      cafeCount: 0,
      webCount: 0,
      newsCount: 0,
    };

    try {
      console.log(`문서수 자동 수집 시작: ${keywordData!.keyword}`);
      // API 사용량 모니터링 (4개 서비스 호출)
      NaverApiUsageMonitor.incrementUsage(4);
      
      documentCounts = await getDocumentCounts(keywordData!.keyword);
      console.log(`문서수 수집 완료:`, documentCounts);
    } catch (docError) {
      console.error('문서수 수집 실패:', docError);
      // 문서수 수집 실패해도 키워드 저장은 계속 진행
    }

    if (existing) {
      // 업데이트
      const { data, error } = await (supabase as any)
        .from('keywords')
        .update({
          monthly_pc_qc_cnt: parseNaverNumber(keywordData!.monthlyPcQcCnt),
          monthly_mobile_qc_cnt: parseNaverNumber(keywordData!.monthlyMobileQcCnt),
          monthly_ave_pc_clk_cnt: parseFloat(keywordData!.monthlyAvePcClkCnt) || 0,
          monthly_ave_mobile_clk_cnt: parseFloat(keywordData!.monthlyAveMobileClkCnt) || 0,
          monthly_ave_pc_ctr: parseFloat(keywordData!.monthlyAvePcCtr) || 0,
          monthly_ave_mobile_ctr: parseFloat(keywordData!.monthlyAveMobileCtr) || 0,
          pl_avg_depth: parseNaverNumber(keywordData!.plAvgDepth),
          comp_idx: keywordData!.compIdx as '낮음' | '중간' | '높음',
          blog_count: documentCounts.blogCount,
          cafe_count: documentCounts.cafeCount,
          web_count: documentCounts.webCount,
          news_count: documentCounts.newsCount,
          last_checked_at: now,
          updated_at: now,
        })
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) {
        console.error('키워드 업데이트 오류:', error);
        throw error;
      }

      console.log('키워드 업데이트 성공:', data);
      return NextResponse.json({
        success: true,
        data: { 
          id: (data as { id: string }).id, 
          action: 'updated',
          documentCounts,
          apiUsage: {
            count: NaverApiUsageMonitor.getUsageCount(),
            percentage: NaverApiUsageMonitor.getUsagePercentage(),
          },
        },
      });
    } else {
      // 새로 삽입
      const { data, error } = await (supabase as any)
        .from('keywords')
        .insert({
          keyword: keywordData!.keyword,
          monthly_pc_qc_cnt: parseNaverNumber(keywordData!.monthlyPcQcCnt),
          monthly_mobile_qc_cnt: parseNaverNumber(keywordData!.monthlyMobileQcCnt),
          monthly_ave_pc_clk_cnt: parseFloat(keywordData!.monthlyAvePcClkCnt) || 0,
          monthly_ave_mobile_clk_cnt: parseFloat(keywordData!.monthlyAveMobileClkCnt) || 0,
          monthly_ave_pc_ctr: parseFloat(keywordData!.monthlyAvePcCtr) || 0,
          monthly_ave_mobile_ctr: parseFloat(keywordData!.monthlyAveMobileCtr) || 0,
          pl_avg_depth: parseNaverNumber(keywordData!.plAvgDepth),
          comp_idx: keywordData!.compIdx as '낮음' | '중간' | '높음',
          blog_count: documentCounts.blogCount,
          cafe_count: documentCounts.cafeCount,
          web_count: documentCounts.webCount,
          news_count: documentCounts.newsCount,
          last_checked_at: now,
          tags: [],
          is_favorite: false,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('키워드 삽입 오류:', error);
        throw error;
      }

      console.log('키워드 삽입 성공:', data);
      return NextResponse.json({
        success: true,
        data: { 
          id: (data as { id: string }).id, 
          action: 'created',
          documentCounts,
          apiUsage: {
            count: NaverApiUsageMonitor.getUsageCount(),
            percentage: NaverApiUsageMonitor.getUsagePercentage(),
          },
        },
      });
    }

  } catch (error) {
    console.error('키워드 저장 오류:', error);
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
      keyword: keywordData?.keyword || 'unknown'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
