import { NextRequest, NextResponse } from 'next/server';
import { getBatchDocumentCounts, NaverApiUsageMonitor } from '@/lib/naver/documents';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '키워드 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    if (keywords.length > 50) {
      return NextResponse.json(
        { success: false, error: '최대 50개의 키워드만 처리할 수 있습니다.' },
        { status: 400 }
      );
    }

    // API 사용량 모니터링 (키워드당 4개 서비스 호출)
    const estimatedUsage = keywords.length * 4;
    NaverApiUsageMonitor.incrementUsage(estimatedUsage);

    console.log(`배치 문서수 조회 시작: ${keywords.length}개 키워드 (예상 API 사용량: ${estimatedUsage}회)`);

    // 배치 문서수 조회
    const results = await getBatchDocumentCounts(keywords);

    // 데이터베이스 업데이트 (배치 처리)
    const supabase = createClient();
    const updatePromises = results.map(async (result) => {
      const { data: existing } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', result.keyword)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('keywords')
          .update({
            blog_count: result.blogCount,
            cafe_count: result.cafeCount,
            web_count: result.webCount,
            news_count: result.newsCount,
            last_checked_at: new Date().toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
          .eq('id', existing.id);

        if (error) {
          console.error(`키워드 업데이트 오류 (${result.keyword}):`, error);
        }
        return { success: !error, keyword: result.keyword };
      }
      return null;
    });

    await Promise.all(updatePromises.filter(Boolean));

    const successCount = results.filter(r => r.totalDocCount > 0).length;
    const totalApiUsage = NaverApiUsageMonitor.getUsageCount();

    console.log(`배치 문서수 조회 완료: ${successCount}/${keywords.length}개 성공 (총 API 사용량: ${totalApiUsage}회)`);

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalKeywords: keywords.length,
          successCount,
          failedCount: keywords.length - successCount,
          apiUsage: {
            count: totalApiUsage,
            percentage: NaverApiUsageMonitor.getUsagePercentage(),
          },
        },
      },
    });

  } catch (error) {
    console.error('배치 문서수 조회 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
