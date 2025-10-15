'use client';

import { useEffect, useState, useCallback } from 'react';
import { useKeywordStore } from '@/store/keyword-store';
import { Keyword, FilterOptions } from '@/types/keyword';
import { supabase } from '@/lib/supabase/client';
import { SimpleKeywordTable } from '@/components/data/SimpleKeywordTable';
import { FilterSidebar } from '@/components/data/FilterSidebar';
import { BulkActions } from '@/components/data/BulkActions';
import { Pagination } from '@/components/data/Pagination';
import { SimpleAutoCollect } from '@/components/home/SimpleAutoCollect';
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

  // 자동 수집을 위한 시드키워드 상태
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  
  // 정렬 상태 - 기본값: 카페문서수 오름차순
  const [sortField, setSortField] = useState<string>('cafe_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 기본 필터는 키워드 스토어에서 설정됨 (사용자 수정 가능)

  const fetchKeywords = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`키워드 조회 시작: page=${page}, size=${size}`);
      
      // 서버사이드 페이지네이션을 위한 API 호출
      const response = await fetch('/api/keywords/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          pageSize: size,
          filters,
          sortField,
          sortDirection,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '키워드 조회에 실패했습니다.');
      }

      const { keywords: paginatedKeywords, totalCount: filteredTotalCount, totalCountInDB } = result.data;

      setKeywords(paginatedKeywords as Keyword[]);
      setTotalCount(filteredTotalCount); // 필터링된 전체 개수 (페이지네이션용)
      setLastUpdateTime(new Date());
      
      // 자동 수집을 위한 시드키워드 설정 (상위 3개)
      if (paginatedKeywords.length > 0) {
        setSeedKeywords(paginatedKeywords.slice(0, 3).map(k => k.keyword));
      }
      
      console.log(`키워드 조회 완료: ${paginatedKeywords.length}개 (필터링된 총 ${filteredTotalCount}개, 전체 ${totalCountInDB}개)`);
      console.log(`페이지네이션 정보: 현재페이지=${page}, 페이지크기=${size}, 총페이지수=${Math.ceil(filteredTotalCount / size)}`);
    } catch (error) {
      console.error('키워드 조회 오류:', error);
      setError(error instanceof Error ? error.message : '키워드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [setKeywords, setLoading, filters, currentPage, pageSize, sortField, sortDirection]); // 정렬 의존성 추가

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


  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // 카페문서수는 항상 오름차순으로 고정 (다중 정렬 때문)
      if (field === 'cafe_count') {
        return; // 카페문서수는 정렬 방향 변경 불가
      }
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // 카페문서수는 항상 오름차순, 나머지는 내림차순
      setSortDirection(field === 'cafe_count' ? 'asc' : 'desc');
    }
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  }, [sortField, sortDirection]);




  useEffect(() => {
    fetchKeywords(currentPage, pageSize);
    fetchStats();
  }, [fetchKeywords, fetchStats, currentPage, pageSize, filters, sortField, sortDirection]); // 정렬 변경 시에도 호출


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
      setKeywords(updatedKeywords as Keyword[]);
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
                  <p className="text-sm text-gray-600">문서수 수집</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {keywords.filter(k => k.cafeCount > 0 || k.blogCount > 0 || k.webCount > 0 || k.newsCount > 0).length}
                  </p>
                  <p className="text-xs text-gray-500">수집 완료</p>
                </div>
                <div className="text-2xl">📊</div>
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

        {/* 자동 수집 섹션 */}
        {keywords.length > 0 && seedKeywords.length > 0 && (
          <div className="mb-6">
            <SimpleAutoCollect seedKeywords={seedKeywords} />
          </div>
        )}


        {/* 키워드 테이블 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>키워드 목록</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <SimpleKeywordTable
              keywords={keywords}
              isLoading={isLoading}
              onRefresh={() => fetchKeywords(currentPage, pageSize)}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
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
