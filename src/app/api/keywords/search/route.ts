import { NextRequest, NextResponse } from 'next/server';
import { searchKeywords } from '@/lib/naver/keywords';
import { SearchKeywordsRequest, SearchKeywordsResponse } from '@/types/api';

// API 타임아웃 설정 (30초로 증가)
export const maxDuration = 30;


export async function POST(request: NextRequest) {
  try {
    const body: SearchKeywordsRequest = await request.json();
    const { seedKeywords, showDetail, autoFetchDocs } = body;

    console.log('키워드 검색 요청:', { seedKeywords, showDetail, autoFetchDocs });

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
        message: autoFetchDocs 
          ? '검색 완료. 클라이언트에서 자동 저장 및 문서수 조회를 시작합니다.'
          : '검색 완료. 클라이언트에서 자동 저장을 시작합니다.'
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
