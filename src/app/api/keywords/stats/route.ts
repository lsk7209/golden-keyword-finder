import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 총 키워드 수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // 황금키워드 수 조회 (황금점수 >= 50)
    const { count: goldenCount, error: goldenError } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .gte('golden_score', 50);

    if (goldenError) {
      throw goldenError;
    }

    // 최근 24시간 추가된 키워드 수
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: recentCount, error: recentError } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    if (recentError) {
      throw recentError;
    }

    // 평균 황금점수
    const { data: avgData, error: avgError } = await supabase
      .from('keywords')
      .select('golden_score')
      .not('golden_score', 'is', null);

    if (avgError) {
      throw avgError;
    }

    const avgGoldenScore = avgData && avgData.length > 0
      ? avgData.reduce((sum, item) => sum + ((item as Record<string, unknown>).golden_score as number || 0), 0) / avgData.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalKeywords: totalCount || 0,
        goldenKeywords: goldenCount || 0,
        recentKeywords: recentCount || 0,
        avgGoldenScore: Math.round(avgGoldenScore * 100) / 100,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('키워드 통계 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
