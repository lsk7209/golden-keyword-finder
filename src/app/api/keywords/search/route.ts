import { NextRequest, NextResponse } from 'next/server';
import { searchKeywords } from '@/lib/naver/keywords';
import { SearchKeywordsRequest, SearchKeywordsResponse } from '@/types/api';
import { createClient } from '@/lib/supabase/server';
import { getDocumentCounts, NaverApiUsageMonitor } from '@/lib/naver/documents';

// API 타임아웃 설정 (30초)
export const maxDuration = 30;

// 비동기 저장 함수
async function saveKeywordsAsync(keywords: any[]) {
  const supabase = await createClient();
  let savedCount = 0;
  let failedCount = 0;

  for (const keyword of keywords) {
    try {
      // 중복 체크
      const { data: existing } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', keyword.keyword)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        // 업데이트
        await supabase
          .from('keywords')
          // @ts-expect-error - Supabase 타입 정의 문제로 인한 임시 해결
          .update({
            monthly_pc_qc_cnt: keyword.monthlyPcQcCnt,
            monthly_mobile_qc_cnt: keyword.monthlyMobileQcCnt,
            monthly_ave_pc_clk_cnt: keyword.monthlyAvePcClkCnt,
            monthly_ave_mobile_clk_cnt: keyword.monthlyAveMobileClkCnt,
            monthly_ave_pc_ctr: keyword.monthlyAvePcCtr,
            monthly_ave_mobile_ctr: keyword.monthlyAveMobileCtr,
            pl_avg_depth: keyword.plAvgDepth,
            comp_idx: keyword.compIdx as '낮음' | '중간' | '높음',
            updated_at: now,
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('id', (existing as any).id);
      } else {
        // 문서수 자동 수집
        let documentCounts = {
          blogCount: 0,
          cafeCount: 0,
          webCount: 0,
          newsCount: 0,
        };

        try {
          console.log(`문서수 자동 수집 시작: ${keyword.keyword}`);
          NaverApiUsageMonitor.incrementUsage(4);
          documentCounts = await getDocumentCounts(keyword.keyword);
          console.log(`문서수 수집 완료:`, documentCounts);
        } catch (docError) {
          console.error('문서수 수집 실패:', docError);
        }

        // 새로 삽입
        await supabase
          .from('keywords')
          // @ts-expect-error - Supabase 타입 정의 문제로 인한 임시 해결
          .insert({
            keyword: keyword.keyword,
            monthly_pc_qc_cnt: keyword.monthlyPcQcCnt,
            monthly_mobile_qc_cnt: keyword.monthlyMobileQcCnt,
            monthly_ave_pc_clk_cnt: keyword.monthlyAvePcClkCnt,
            monthly_ave_mobile_clk_cnt: keyword.monthlyAveMobileClkCnt,
            monthly_ave_pc_ctr: keyword.monthlyAvePcCtr,
            monthly_ave_mobile_ctr: keyword.monthlyAveMobileCtr,
            pl_avg_depth: keyword.plAvgDepth,
            comp_idx: keyword.compIdx as '낮음' | '중간' | '높음',
            blog_count: documentCounts.blogCount,
            cafe_count: documentCounts.cafeCount,
            web_count: documentCounts.webCount,
            news_count: documentCounts.newsCount,
            last_checked_at: now,
            tags: [],
            is_favorite: false,
            created_at: now,
            updated_at: now,
          });
      }

      savedCount++;
      console.log(`키워드 저장 완료: ${keyword.keyword}`);
    } catch (error) {
      failedCount++;
      console.error(`키워드 저장 실패: ${keyword.keyword}`, error);
    }

    // 저장 간격
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`비동기 저장 완료: ${savedCount}개 성공, ${failedCount}개 실패`);
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchKeywordsRequest = await request.json();
    const { seedKeywords, showDetail } = body;

    console.log('키워드 검색 요청:', { seedKeywords, showDetail });

    if (!seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '시드 키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    if (seedKeywords.length > 5) {
      return NextResponse.json(
        { success: false, error: '최대 5개의 키워드만 입력할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 환경변수 확인
    console.log('환경변수 확인:', {
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      SEARCHAD_BASE_URL: process.env.SEARCHAD_BASE_URL || '미설정',
    });

    // 네이버 API 호출
    console.log('네이버 API 호출 시작...');
    const naverKeywords = await searchKeywords(seedKeywords, showDetail);
    console.log('네이버 API 응답:', naverKeywords.length, '개 키워드');

    // 응답 데이터 변환
    const keywords = naverKeywords.map(k => ({
      keyword: k.keyword,
      monthlyPcQcCnt: parseInt(k.monthlyPcQcCnt) || 0,
      monthlyMobileQcCnt: parseInt(k.monthlyMobileQcCnt) || 0,
      monthlyAvePcClkCnt: parseFloat(k.monthlyAvePcClkCnt) || 0,
      monthlyAveMobileClkCnt: parseFloat(k.monthlyAveMobileClkCnt) || 0,
      monthlyAvePcCtr: parseFloat(k.monthlyAvePcCtr) || 0,
      monthlyAveMobileCtr: parseFloat(k.monthlyAveMobileCtr) || 0,
      plAvgDepth: parseInt(k.plAvgDepth) || 0,
      compIdx: k.compIdx,
    }));

    // 자동 저장을 클라이언트에서 처리하도록 변경 (API 응답 속도 개선)
    console.log('키워드 검색 완료, 클라이언트에서 저장 처리');

    const response: SearchKeywordsResponse = { 
      keywords,
      saveResult: {
        saved: 0,
        failed: 0,
        total: keywords.length,
        message: '검색 완료. 클라이언트에서 자동 저장을 시작합니다.'
      }
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('키워드 검색 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
