'use client';

import { useState, useMemo, memo } from 'react';
import { Keyword } from '@/types/keyword';
import { formatNumber, formatDate, getCompetitionColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SimpleKeywordTableProps {
  keywords: Keyword[];
  isLoading: boolean;
  onRefresh: () => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const SimpleKeywordTable = memo(function SimpleKeywordTable({ 
  keywords, 
  isLoading, 
  onRefresh, 
  onSort, 
  sortField: serverSortField, 
  sortDirection: serverSortDirection 
}: SimpleKeywordTableProps) {

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  // 서버에서 정렬된 데이터를 그대로 사용
  const sortedKeywords = keywords;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">키워드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">저장된 키워드가 없습니다</h3>
        <p className="text-gray-600 mb-4">홈 페이지에서 키워드를 검색하고 저장해보세요.</p>
        <Button onClick={onRefresh} variant="outline">
          새로고침
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          키워드 목록 ({keywords.length}개)
        </h3>
        <Button onClick={onRefresh} variant="outline" size="sm">
          새로고침
        </Button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('keyword')}
              >
                키워드
                {serverSortField === 'keyword' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthly_pc_qc_cnt')}
              >
                총 검색수
                {serverSortField === 'monthly_pc_qc_cnt' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cafe_count')}
              >
                카페문서수
                {serverSortField === 'cafe_count' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('blog_count')}
              >
                블로그문서수
                {serverSortField === 'blog_count' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('web_count')}
              >
                웹문서수
                {serverSortField === 'web_count' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('news_count')}
              >
                뉴스문서수
                {serverSortField === 'news_count' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthly_pc_qc_cnt')}
              >
                PC 검색수
                {serverSortField === 'monthly_pc_qc_cnt' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthly_mobile_qc_cnt')}
              >
                모바일 검색수
                {serverSortField === 'monthly_mobile_qc_cnt' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('comp_idx')}
              >
                경쟁도
                {serverSortField === 'comp_idx' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthly_ave_pc_ctr')}
              >
                PC CTR
                {serverSortField === 'monthly_ave_pc_ctr' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthly_ave_mobile_ctr')}
              >
                모바일 CTR
                {serverSortField === 'monthly_ave_mobile_ctr' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('pl_avg_depth')}
              >
                광고수
                {serverSortField === 'pl_avg_depth' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                저장일
                {serverSortField === 'created_at' && (
                  <span className="ml-1">{serverSortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedKeywords.map((keyword) => (
              <tr key={keyword.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {keyword.keyword}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.totalSearchVolume || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.cafeCount || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.blogCount || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.webCount || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.newsCount || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.monthlyPcQcCnt || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.monthlyMobileQcCnt || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Badge 
                    variant="outline" 
                    className={getCompetitionColor(keyword.compIdx || '중간')}
                  >
                    {keyword.compIdx || '중간'}
                  </Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(keyword.monthlyAvePcCtr || 0).toFixed(2)}%
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(keyword.monthlyAveMobileCtr || 0).toFixed(2)}%
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(keyword.plAvgDepth || 0)}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(keyword.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 정보 */}
      <div className="text-center text-sm text-gray-500">
        총 {keywords.length}개의 키워드가 표시되고 있습니다.
      </div>
    </div>
  );
});
