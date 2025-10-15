import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NaverKeyword } from '@/types/keyword';
import { parseNaverNumber } from '@/lib/naver/keywords';

export async function POST(request: NextRequest) {
  try {
    const keywords: NaverKeyword[] = await request.json();
    
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '키워드 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 배치로 처리하여 성능 향상
    const batchSize = 10;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
      const keywordObjects = batch.map(keyword => ({
        keyword: keyword.keyword,
        monthly_pc_qc_cnt: parseNaverNumber(keyword.monthlyPcQcCnt),
        monthly_mobile_qc_cnt: parseNaverNumber(keyword.monthlyMobileQcCnt),
        monthly_ave_pc_clk_cnt: parseFloat(keyword.monthlyAvePcClkCnt) || 0,
        monthly_ave_mobile_clk_cnt: parseFloat(keyword.monthlyAveMobileClkCnt) || 0,
        monthly_ave_pc_ctr: parseFloat(keyword.monthlyAvePcCtr) || 0,
        monthly_ave_mobile_ctr: parseFloat(keyword.monthlyAveMobileCtr) || 0,
        pl_avg_depth: parseNaverNumber(keyword.plAvgDepth),
        comp_idx: keyword.compIdx as '낮음' | '중간' | '높음',
        blog_count: 0, // 문서수는 나중에 별도로 수집
        cafe_count: 0,
        web_count: 0,
        news_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      try {
        const { error } = await supabase
          .from('keywords')
          .upsert(keywordObjects, { 
            onConflict: 'keyword',
            ignoreDuplicates: false 
          });

        if (error) {
          results.failed += batch.length;
          results.errors.push(`배치 ${i}-${i + batch.length}: ${error.message}`);
        } else {
          results.success += batch.length;
        }
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(`배치 ${i}-${i + batch.length}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: keywords.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors,
      },
    });

  } catch (error) {
    console.error('배치 키워드 저장 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
