'use client';

import { useState } from 'react';
import { Keyword } from '@/types/keyword';
import { formatNumber, formatDate, getCompetitionColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SimpleKeywordTableProps {
  keywords: Keyword[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function SimpleKeywordTable({ keywords, isLoading, onRefresh }: SimpleKeywordTableProps) {
  const [sortField, setSortField] = useState<keyof Keyword>('totalSearchVolume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Keyword) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    // 기본 정렬: 총검색수 내림차순 + 카페문서수 오름차순
    if (sortField === 'totalSearchVolume' && sortDirection === 'desc') {
      // 총검색수 내림차순
      const searchVolumeDiff = (b.totalSearchVolume || 0) - (a.totalSearchVolume || 0);
      if (searchVolumeDiff !== 0) {
        return searchVolumeDiff;
      }
      // 총검색수가 같으면 카페문서수 오름차순
      return (a.cafeCount || 0) - (b.cafeCount || 0);
    }
    
    // 다른 필드 정렬은 기존 로직 사용
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    return 0;
  });

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
                {sortField === 'keyword' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalSearchVolume')}
              >
                총 검색수
                {sortField === 'totalSearchVolume' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cafeCount')}
              >
                카페문서수
                {sortField === 'cafeCount' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('blogCount')}
              >
                블로그문서수
                {sortField === 'blogCount' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('webCount')}
              >
                웹문서수
                {sortField === 'webCount' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('newsCount')}
              >
                뉴스문서수
                {sortField === 'newsCount' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthlyPcQcCnt')}
              >
                PC 검색수
                {sortField === 'monthlyPcQcCnt' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthlyMobileQcCnt')}
              >
                모바일 검색수
                {sortField === 'monthlyMobileQcCnt' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('compIdx')}
              >
                경쟁도
                {sortField === 'compIdx' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthlyAvePcCtr')}
              >
                PC CTR
                {sortField === 'monthlyAvePcCtr' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('monthlyAveMobileCtr')}
              >
                모바일 CTR
                {sortField === 'monthlyAveMobileCtr' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('plAvgDepth')}
              >
                광고수
                {sortField === 'plAvgDepth' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                저장일
                {sortField === 'createdAt' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
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
}
