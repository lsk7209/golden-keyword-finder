import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Keyword, FilterOptions } from '@/types/keyword';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      page = 1, 
      pageSize = 100, 
      filters = {}, 
      sortField = 'cafe_count', 
      sortDirection = 'asc' 
    } = body;

    console.log('키워드 목록 API 호출:', { page, pageSize, sortField, sortDirection });

    const supabase = await createClient();

    // 기본 쿼리 빌더
    let query = supabase
      .from('keywords')
      .select('*', { count: 'exact' });

    // 필터 적용
    if (filters.searchTerm) {
      query = query.ilike('keyword', `%${filters.searchTerm}%`);
    }

    if (filters.competitionLevels && filters.competitionLevels.length > 0) {
      query = query.in('comp_idx', filters.competitionLevels);
    }

    if (filters.searchVolumeMin !== undefined) {
      query = query.gte('total_search_volume', filters.searchVolumeMin);
    }

    if (filters.searchVolumeMax !== undefined) {
      query = query.lte('total_search_volume', filters.searchVolumeMax);
    }

    if (filters.docCountMax !== undefined) {
      query = query.lte('total_doc_count', filters.docCountMax);
    }

    if (filters.cafeCountMin !== undefined) {
      query = query.gte('cafe_count', filters.cafeCountMin);
    }

    if (filters.cafeCountMax !== undefined) {
      query = query.lte('cafe_count', filters.cafeCountMax);
    }

    if (filters.blogCountMin !== undefined) {
      query = query.gte('blog_count', filters.blogCountMin);
    }

    if (filters.blogCountMax !== undefined) {
      query = query.lte('blog_count', filters.blogCountMax);
    }

    if (filters.webCountMin !== undefined) {
      query = query.gte('web_count', filters.webCountMin);
    }

    if (filters.webCountMax !== undefined) {
      query = query.lte('web_count', filters.webCountMax);
    }

    if (filters.newsCountMin !== undefined) {
      query = query.gte('news_count', filters.newsCountMin);
    }

    if (filters.newsCountMax !== undefined) {
      query = query.lte('news_count', filters.newsCountMax);
    }

    if (filters.goldenScoreRange) {
      query = query.gte('golden_score', filters.goldenScoreRange[0]);
      query = query.lte('golden_score', filters.goldenScoreRange[1]);
    }

    if (filters.dateRange) {
      query = query.gte('created_at', filters.dateRange[0].toISOString());
      query = query.lte('created_at', filters.dateRange[1].toISOString());
    }

    if (filters.showZeroDocCount === false) {
      query = query.gt('total_doc_count', 0);
    }

    // 정렬 적용
    if (sortField === 'cafe_count') {
      // 카페문서수 오름차순(1순위) + 총검색수 내림차순(2순위)
      query = query.order('cafe_count', { ascending: true });
      query = query.order('total_search_volume', { ascending: false });
    } else {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    // 전체 개수 조회 (필터링된)
    const { count: filteredCount, error: countError } = await query;
    
    if (countError) {
      console.error('카운트 조회 오류:', countError);
      throw countError;
    }

    // 페이지네이션 적용
    const offset = (page - 1) * pageSize;
    const { data, error } = await query
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('키워드 조회 오류:', error);
      throw error;
    }

    // 전체 데이터베이스 개수 조회
    const { count: totalCountInDB } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    // 데이터 변환
    const keywords: Keyword[] = (data || []).map((item: any) => ({
      id: item.id,
      keyword: item.keyword,
      monthlyPcQcCnt: item.monthly_pc_qc_cnt,
      monthlyMobileQcCnt: item.monthly_mobile_qc_cnt,
      totalSearchVolume: item.total_search_volume,
      monthlyAvePcClkCnt: item.monthly_ave_pc_clk_cnt,
      monthlyAveMobileClkCnt: item.monthly_ave_mobile_clk_cnt,
      monthlyAvePcCtr: item.monthly_ave_pc_ctr,
      monthlyAveMobileCtr: item.monthly_ave_mobile_ctr,
      plAvgDepth: item.pl_avg_depth,
      compIdx: item.comp_idx,
      blogCount: item.blog_count,
      cafeCount: item.cafe_count,
      webCount: item.web_count,
      newsCount: item.news_count,
      totalDocCount: item.total_doc_count,
      goldenScore: item.golden_score,
      tags: item.tags,
      notes: item.notes || undefined,
      isFavorite: item.is_favorite,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      lastCheckedAt: item.last_checked_at || undefined,
    }));

    console.log(`서버사이드 페이지네이션 완료: ${keywords.length}개 (필터링된 총 ${filteredCount}개, 전체 ${totalCountInDB}개)`);

    return NextResponse.json({
      success: true,
      data: {
        keywords,
        totalCount: filteredCount || 0,
        totalCountInDB: totalCountInDB || 0,
        page,
        pageSize,
        totalPages: Math.ceil((filteredCount || 0) / pageSize),
      },
    });

  } catch (error) {
    console.error('키워드 목록 API 오류:', error);
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
