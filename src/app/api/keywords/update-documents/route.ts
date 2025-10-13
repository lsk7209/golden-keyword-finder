import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocumentCounts, NaverApiUsageMonitor } from '@/lib/naver/documents';

export async function POST(request: NextRequest) {
  try {
    console.log('문서수 자동 수집 시작...');
    
    const supabase = await createClient();
    
    // 문서수가 0이거나 null인 키워드들을 조회 (최대 50개)
    const { data: keywords, error: fetchError } = await supabase
      .from('keywords')
      .select('id, keyword, cafe_count, blog_count, web_count, news_count')
      .or('cafe_count.is.null,cafe_count.eq.0,blog_count.is.null,blog_count.eq.0,web_count.is.null,web_count.eq.0,news_count.is.null,news_count.eq.0')
      .limit(50)
      .order('created_at', { ascending: true }); // 오래된 것부터 처리
    
    if (fetchError) {
      console.error('키워드 조회 오류:', fetchError);
      throw fetchError;
    }

    if (!keywords || keywords.length === 0) {
      console.log('문서수 수집이 필요한 키워드가 없습니다.');
      return NextResponse.json({
        success: true,
        data: {
          processed: 0,
          updated: 0,
          failed: 0,
          message: '문서수 수집이 필요한 키워드가 없습니다.'
        }
      });
    }

    console.log(`${keywords.length}개 키워드의 문서수 수집 시작`);

    let updatedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const keyword of keywords) {
      try {
        console.log(`문서수 수집 중: ${keyword.keyword}`);
        
        // API 사용량 모니터링 (4개 서비스 호출)
        NaverApiUsageMonitor.incrementUsage(4);
        
        const documentCounts = await getDocumentCounts(keyword.keyword);
        
        // 문서수 업데이트
        const { error: updateError } = await supabase
          .from('keywords')
          .update({
            cafe_count: documentCounts.cafeCount,
            blog_count: documentCounts.blogCount,
            web_count: documentCounts.webCount,
            news_count: documentCounts.newsCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword.id);

        if (updateError) {
          console.error(`키워드 ${keyword.keyword} 업데이트 실패:`, updateError);
          failedCount++;
          results.push({
            keyword: keyword.keyword,
            status: 'failed',
            error: updateError.message
          });
        } else {
          console.log(`키워드 ${keyword.keyword} 문서수 수집 완료:`, documentCounts);
          updatedCount++;
          results.push({
            keyword: keyword.keyword,
            status: 'success',
            documentCounts
          });
        }

        // API 호출 간격 조절 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`키워드 ${keyword.keyword} 문서수 수집 실패:`, error);
        failedCount++;
        results.push({
          keyword: keyword.keyword,
          status: 'failed',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    console.log(`문서수 자동 수집 완료: ${updatedCount}개 성공, ${failedCount}개 실패`);

    return NextResponse.json({
      success: true,
      data: {
        processed: keywords.length,
        updated: updatedCount,
        failed: failedCount,
        results: results.slice(0, 10), // 최대 10개 결과만 반환
        message: `${updatedCount}개 키워드의 문서수 수집 완료`
      }
    });

  } catch (error) {
    console.error('문서수 자동 수집 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '문서수 자동 수집 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// GET 요청으로 수동 실행 가능
export async function GET(request: NextRequest) {
  return POST(request);
}
