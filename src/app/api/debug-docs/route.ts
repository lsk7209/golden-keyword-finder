import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCounts } from '@/lib/naver/documents';

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: '키워드가 필요합니다.',
      }, { status: 400 });
    }

    console.log(`문서수 수집 테스트 시작: ${keyword}`);
    
    const documentCounts = await getDocumentCounts(keyword);
    
    console.log(`문서수 수집 테스트 완료:`, documentCounts);

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        documentCounts,
      },
    });
  } catch (error) {
    console.error('문서수 수집 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '문서수 수집 테스트 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
