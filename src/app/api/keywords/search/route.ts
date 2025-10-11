import { NextRequest, NextResponse } from 'next/server';
import { searchKeywords } from '@/lib/naver/keywords';
import { SearchKeywordsRequest, SearchKeywordsResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: SearchKeywordsRequest = await request.json();
    const { seedKeywords, showDetail } = body;

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

    // 네이버 API 호출
    const naverKeywords = await searchKeywords(seedKeywords, showDetail);

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

    const response: SearchKeywordsResponse = { keywords };

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
