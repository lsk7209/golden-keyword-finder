'use client';

import { useEffect, useState, useCallback } from 'react';
import { useKeywordStore } from '@/store/keyword-store';
import { Keyword, FilterOptions } from '@/types/keyword';
import { supabase } from '@/lib/supabase/client';
import { SimpleKeywordTable } from '@/components/data/SimpleKeywordTable';
import { FilterSidebar } from '@/components/data/FilterSidebar';
import { BulkActions } from '@/components/data/BulkActions';
import { Pagination } from '@/components/data/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

export default function DataPage() {
  const {
    keywords,
    selectedIds,
    isLoading,
    filters,
    filteredKeywords,
    setKeywords,
    setLoading,
    setFilters,
    clearSelection,
  } = useKeywordStore();

  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalKeywords: 0,
    goldenKeywords: 0,
    recentKeywords: 0,
    avgGoldenScore: 0,
  });
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);

  const fetchKeywords = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * size;
      console.log(`키워드 조회 시작: page=${page}, size=${size}, offset=${offset}`);
      
      // 서버사이드 필터링 적용
      let query = supabase
        .from('keywords')
        .select('*', { count: 'exact' });

      // 검색어 필터
      if (filters.searchTerm) {
        query = query.ilike('keyword', `%${filters.searchTerm}%`);
      }

      // 경쟁도 필터
      if (filters.competitionLevels.length > 0 && filters.competitionLevels.length < 3) {
        query = query.in('comp_idx', filters.competitionLevels);
      }

      // 검색량 범위 필터
      if (filters.searchVolumeMin > 0) {
        query = query.gte('monthly_pc_qc_cnt', filters.searchVolumeMin);
      }
      if (filters.searchVolumeMax < 999999999) {
        query = query.lte('monthly_pc_qc_cnt', filters.searchVolumeMax);
      }

      // 문서수 범위 필터
      if (filters.cafeCountMin > 0) {
        query = query.gte('cafe_count', filters.cafeCountMin);
      }
      if (filters.cafeCountMax < 999999999) {
        query = query.lte('cafe_count', filters.cafeCountMax);
      }
      if (filters.blogCountMin > 0) {
        query = query.gte('blog_count', filters.blogCountMin);
      }
      if (filters.blogCountMax < 999999999) {
        query = query.lte('blog_count', filters.blogCountMax);
      }
      if (filters.webCountMin > 0) {
        query = query.gte('web_count', filters.webCountMin);
      }
      if (filters.webCountMax < 999999999) {
        query = query.lte('web_count', filters.webCountMax);
      }
      if (filters.newsCountMin > 0) {
        query = query.gte('news_count', filters.newsCountMin);
      }
      if (filters.newsCountMax < 999999999) {
        query = query.lte('news_count', filters.newsCountMax);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false }) // 기본 정렬: 최신순
        .range(offset, offset + size - 1);

      if (error) {
        console.error('Supabase 오류:', error);
        setError(`데이터베이스 오류: ${error.message}`);
        throw error;
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const keywords: Keyword[] = data.map((item: any) => ({
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

        setKeywords(keywords);
        setTotalCount(count || 0);
        setLastUpdateTime(new Date());
        console.log(`키워드 조회 완료: ${keywords.length}개 (총 ${count}개)`);
      } else {
        console.log('데이터가 없습니다.');
        setKeywords([]);
      }
    } catch (error) {
      console.error('키워드 조회 오류:', error);
      setError(error instanceof Error ? error.message : '키워드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [setKeywords, setLoading, filters, currentPage, pageSize]); // 모든 의존성 추가

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/keywords/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  }, [setStats]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [setFilters]);

  useEffect(() => {
    fetchKeywords(currentPage, pageSize);
    fetchStats();
  }, [fetchKeywords, fetchStats, currentPage, pageSize, filters]); // 필터 변경 시에도 호출


  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('keywords')
        .delete()
        .in('id', selectedIds);

      if (error) {
        throw error;
      }

      // 로컬 상태 업데이트
      const updatedKeywords = keywords.filter(k => !selectedIds.includes(k.id));
      setKeywords(updatedKeywords);
      clearSelection();

      console.log(`${selectedIds.length}개 키워드가 삭제되었습니다.`);
    } catch (error) {
      console.error('벌크 삭제 오류:', error);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['키워드', 'PC 검색수', '모바일 검색수', '총 검색수', 'PC CTR', '모바일 CTR', '광고수', '경쟁도', '블로그', '카페', '웹문서', '뉴스', '총 문서수', '황금점수', '수집일'],
      ...filteredKeywords.map(k => [
        k.keyword,
        k.monthlyPcQcCnt,
        k.monthlyMobileQcCnt,
        k.totalSearchVolume,
        k.monthlyAvePcCtr,
        k.monthlyAveMobileCtr,
        k.plAvgDepth,
        k.compIdx,
        k.blogCount,
        k.cafeCount,
        k.webCount,
        k.newsCount,
        k.totalDocCount,
        k.goldenScore,
        new Date(k.createdAt).toLocaleDateString('ko-KR'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFetchDocs = async () => {
    if (selectedIds.length === 0) return;

    const selectedKeywords = keywords.filter(k => selectedIds.includes(k.id));
    const keywordsToFetch = selectedKeywords.map(k => k.keyword);

    try {
      setLoading(true);
      
      const response = await fetch('/api/documents/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords: keywordsToFetch }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '배치 문서수 조회에 실패했습니다.');
      }

      console.log('배치 문서수 조회 완료:', result.data);
      
      // 데이터 새로고침
      await fetchKeywords();
      clearSelection();

      alert(`배치 문서수 조회 완료: ${result.data.summary.successCount}/${result.data.summary.totalKeywords}개 성공`);
    } catch (error) {
      console.error('배치 문서수 조회 오류:', error);
      alert('배치 문서수 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로컬 통계는 현재 사용하지 않음 (서버 통계 사용)
  // const localStats = {
  //   total: keywords.length,
  //   filtered: filteredKeywords.length,
  //   golden: goldenKeywords.length,
  //   avgGoldenScore: filteredKeywords.length > 0 
  //     ? (filteredKeywords.reduce((sum, k) => sum + k.goldenScore, 0) / filteredKeywords.length).toFixed(2)
  //     : 0,
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 키워드 데이터</h1>
              <p className="text-gray-600">저장된 키워드들을 관리하고 분석하세요</p>
              {lastUpdateTime && (
                <p className="text-sm text-gray-500 mt-1">
                  마지막 업데이트: {lastUpdateTime.toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 키워드</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalKeywords)}</p>
                  <p className="text-xs text-gray-500">DB 전체</p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">최근 24시간</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(stats.recentKeywords)}</p>
                  <p className="text-xs text-gray-500">새로 추가</p>
                </div>
                <div className="text-2xl">🆕</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">황금키워드</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats.goldenKeywords)}</p>
                  <p className="text-xs text-gray-500">점수 ≥ 50</p>
                </div>
                <div className="text-2xl">💎</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 황금점수</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgGoldenScore.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">전체 평균</p>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">데이터 로딩 오류</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        setError(null);
                        fetchKeywords();
                        fetchStats();
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      다시 시도
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              {showFilters ? '필터 숨기기' : '필터 보기'}
            </Button>
            
            {selectedIds.length > 0 && (
              <Badge variant="secondary">
                {selectedIds.length}개 선택됨
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={filteredKeywords.length === 0}
            >
              📥 CSV 내보내기
            </Button>
            
            <Button
              onClick={() => {
                fetchKeywords();
                fetchStats();
              }}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? '새로고침 중...' : '🔄 새로고침'}
            </Button>
          </div>
        </div>

        {/* 필터 사이드바 */}
        {showFilters && (
          <div className="mb-6">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        )}

        {/* 벌크 액션 */}
        {selectedIds.length > 0 && (
          <div className="mb-6">
            <BulkActions
              selectedCount={selectedIds.length}
              onBulkDelete={handleBulkDelete}
              onClearSelection={clearSelection}
              onBulkFetchDocs={handleBulkFetchDocs}
            />
          </div>
        )}

        {/* 디버깅 정보 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">디버깅 정보</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>전체 키워드: {keywords.length}개</p>
            <p>필터링된 키워드: {filteredKeywords.length}개</p>
            <p>로딩 상태: {isLoading ? '로딩 중' : '완료'}</p>
            <p>서버사이드 필터링 + 페이지네이션 사용 중</p>
            {keywords.length > 0 && (
              <div>
                <p>첫 번째 키워드: {keywords[0].keyword}</p>
                <p>검색량: {keywords[0].totalSearchVolume || 0}</p>
                <p>경쟁도: {keywords[0].compIdx || '중간'}</p>
              </div>
            )}
          </div>
        </div>

        {/* 키워드 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>키워드 목록</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SimpleKeywordTable
              keywords={keywords}
              isLoading={isLoading}
              onRefresh={() => fetchKeywords(currentPage, pageSize)}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              totalCount={totalCount}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
