'use client';

import { useState } from 'react';
import { NaverKeyword } from '@/types/keyword';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, FileText, Loader2 } from 'lucide-react';
import { formatNumber, getCompetitionColor } from '@/lib/utils';
import { parseNaverNumber } from '@/lib/naver/keywords';

interface KeywordTableProps {
  keywords: NaverKeyword[];
  onSave?: (keyword: NaverKeyword) => Promise<void>;
  onFetchDocs: (keyword: string) => Promise<void>;
  isSaving?: boolean;
  isFetchingDocs: boolean;
  autoSaveProgress?: {
    isActive: boolean;
    current: number;
    total: number;
    completed: number;
    failed: number;
  };
}

export function KeywordTable({
  keywords,
  onSave: _onSave,
  onFetchDocs,
  isSaving: _isSaving,
  isFetchingDocs,
  autoSaveProgress,
}: KeywordTableProps) {
  const [sortField, setSortField] = useState<keyof NaverKeyword>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [fetchingKeywords, setFetchingKeywords] = useState<Set<string>>(new Set());

  const handleSort = (field: keyof NaverKeyword) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFetchDocs = async (keyword: string) => {
    setFetchingKeywords(prev => new Set(prev).add(keyword));
    try {
      await onFetchDocs(keyword);
    } finally {
      setFetchingKeywords(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyword);
        return newSet;
      });
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    const aValue = (a as unknown as Record<string, unknown>)[sortField];
    const bValue = (b as unknown as Record<string, unknown>)[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Fallback for other types or mixed types
    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              검색 결과 ({keywords.length}개)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              연관키워드가 자동으로 데이터베이스에 저장됩니다. 문서수를 조회하여 황금점수를 확인하세요
            </p>
          </div>
          {autoSaveProgress?.isActive && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>자동 저장 중... ({autoSaveProgress.current}/{autoSaveProgress.total})</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('keyword')}
                  className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
                >
                  키워드
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('monthlyPcQcCnt')}
                  className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
                >
                  PC 검색수
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('monthlyMobileQcCnt')}
                  className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
                >
                  모바일 검색수
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 검색수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('compIdx')}
                  className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700"
                >
                  경쟁도
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PC CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                모바일 CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                광고수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedKeywords.map((keyword) => {
              const totalSearchVolume = parseNaverNumber(keyword.monthlyPcQcCnt) + parseNaverNumber(keyword.monthlyMobileQcCnt);
              const competitionColor = getCompetitionColor(keyword.compIdx);
              const isFetchingThis = fetchingKeywords.has(keyword.keyword);

              return (
                <tr key={keyword.keyword} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(parseNaverNumber(keyword.monthlyPcQcCnt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(parseNaverNumber(keyword.monthlyMobileQcCnt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatNumber(totalSearchVolume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={competitionColor}>
                      {keyword.compIdx}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.monthlyAvePcCtr}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.monthlyAveMobileCtr}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.plAvgDepth}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleFetchDocs(keyword.keyword)}
                        size="sm"
                        variant="outline"
                        disabled={isFetchingThis || isFetchingDocs}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        {isFetchingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="ml-1">문서수 조회</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {keywords.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-500">다른 키워드로 검색해보세요</p>
        </div>
      )}
    </div>
  );
}
