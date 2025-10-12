'use client';

import { useEffect, useState, useCallback } from 'react';
import { useKeywordStore } from '@/store/keyword-store';
import { Keyword } from '@/types/keyword';
import { supabase } from '@/lib/supabase/client';
import { KeywordTable } from '@/components/data/KeywordTable';
import { FilterSidebar } from '@/components/data/FilterSidebar';
import { BulkActions } from '@/components/data/BulkActions';
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
    goldenKeywords,
    setKeywords,
    setLoading,
    setFilters,
    clearSelection,
  } = useKeywordStore();

  const [showFilters, setShowFilters] = useState(false);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
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
      }
    } catch (error) {
      console.error('키워드 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [setKeywords, setLoading]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

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

  const stats = {
    total: keywords.length,
    filtered: filteredKeywords.length,
    golden: goldenKeywords.length,
    avgGoldenScore: filteredKeywords.length > 0 
      ? (filteredKeywords.reduce((sum, k) => sum + k.goldenScore, 0) / filteredKeywords.length).toFixed(2)
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 키워드 데이터</h1>
          <p className="text-gray-600">저장된 키워드들을 관리하고 분석하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 키워드</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">필터된 키워드</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.filtered)}</p>
                </div>
                <div className="text-2xl">🔍</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">황금키워드</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats.golden)}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{stats.avgGoldenScore}</p>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              onClick={fetchKeywords}
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
              onFiltersChange={setFilters}
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

        {/* 키워드 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>키워드 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <KeywordTable
              keywords={filteredKeywords}
              isLoading={isLoading}
              onRefresh={fetchKeywords}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
