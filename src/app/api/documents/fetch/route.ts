import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCounts, NaverApiUsageMonitor } from '@/lib/naver/documents';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 사용량 모니터링 (4개 서비스 호출)
    NaverApiUsageMonitor.incrementUsage(4);

    // 문서수 조회
    const documentCounts = await getDocumentCounts(keyword);

        // 데이터베이스 업데이트
        const supabase = createClient();
        const { data: existing } = await supabase
      .from('keywords')
      .select('id')
      .eq('keyword', keyword)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('keywords')
        .update({
          blog_count: documentCounts.blogCount,
          cafe_count: documentCounts.cafeCount,
          web_count: documentCounts.webCount,
          news_count: documentCounts.newsCount,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        ...documentCounts,
        apiUsage: {
          count: NaverApiUsageMonitor.getUsageCount(),
          percentage: NaverApiUsageMonitor.getUsagePercentage(),
        },
      },
    });

  } catch (error) {
    console.error('문서수 조회 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
