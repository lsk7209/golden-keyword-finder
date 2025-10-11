'use client';

import { useState } from 'react';
import { Keyword } from '@/types/keyword';
import { useKeywordStore } from '@/store/keyword-store';
import { formatNumber, formatDate, getCompetitionColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TABLE_COLUMNS } from '@/lib/constants';

interface KeywordTableProps {
  keywords: Keyword[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function KeywordTable({ keywords, isLoading, onRefresh }: KeywordTableProps) {
  const { selectedIds, toggleSelection, selectAll, clearSelection } = useKeywordStore();
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    const aValue = (a as any)[sortField];
    const bValue = (b as any)[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const isAllSelected = keywords.length > 0 && selectedIds.length === keywords.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < keywords.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">저장된 키워드가 없습니다</h3>
        <p className="text-gray-500 mb-4">홈 페이지에서 키워드를 검색하고 저장해보세요.</p>
        <Button onClick={onRefresh} variant="outline">
          새로고침
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {TABLE_COLUMNS.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <div className="flex items-center space-x-1">
                  {column.key === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  ) : (
                    <>
                      <span>{column.label}</span>
                      {column.sortable && sortField === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedKeywords.map((keyword) => (
            <tr
              key={keyword.id}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(keyword.id)}
                  onChange={() => toggleSelection(keyword.id)}
                  className="rounded border-gray-300"
                />
              </td>
              
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{keyword.keyword}</div>
                {keyword.isFavorite && (
                  <span className="text-yellow-500 text-xs">⭐</span>
                )}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.monthlyPcQcCnt)}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.monthlyMobileQcCnt)}
              </td>
              
              <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                {formatNumber(keyword.totalSearchVolume)}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {keyword.monthlyAvePcCtr.toFixed(2)}%
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {keyword.monthlyAveMobileCtr.toFixed(2)}%
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {keyword.plAvgDepth}개
              </td>
              
              <td className="px-4 py-3">
                <Badge className={getCompetitionColor(keyword.compIdx)}>
                  {keyword.compIdx}
                </Badge>
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.blogCount)}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.cafeCount)}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.webCount)}
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatNumber(keyword.newsCount)}
              </td>
              
              <td className="px-4 py-3 text-sm font-semibold text-green-600">
                {formatNumber(keyword.totalDocCount)}
              </td>
              
              <td className="px-4 py-3">
                <Badge 
                  variant={keyword.goldenScore >= 50 ? 'default' : 'secondary'}
                  className={keyword.goldenScore >= 50 ? 'bg-yellow-100 text-yellow-800' : ''}
                >
                  {keyword.goldenScore.toFixed(2)}
                </Badge>
              </td>
              
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDate(keyword.createdAt)}
              </td>
              
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // 문서수 조회 기능
                      console.log('문서수 조회:', keyword.keyword);
                    }}
                  >
                    📄
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // 즐겨찾기 토글
                      console.log('즐겨찾기 토글:', keyword.keyword);
                    }}
                  >
                    {keyword.isFavorite ? '⭐' : '☆'}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
