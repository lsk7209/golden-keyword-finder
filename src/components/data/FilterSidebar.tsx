'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterOptions } from '@/types/keyword';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COMPETITION_LEVELS, GOLDEN_SCORE_THRESHOLDS, SEARCH_VOLUME_RANGES } from '@/lib/constants';

interface FilterSidebarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // 로컬 필터와 props 필터 동기화
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: FilterOptions = {
      searchTerm: '',
      goldenScoreRange: [0, 1000],
      competitionLevels: ['낮음', '중간', '높음'],
      searchVolumeMin: 0,
      searchVolumeMax: 1000000,
      docCountMax: 1000000,
      cafeCountMin: 0,
      cafeCountMax: 1000000,
      blogCountMin: 0,
      blogCountMax: 1000000,
      webCountMin: 0,
      webCountMax: 1000000,
      newsCountMin: 0,
      newsCountMax: 1000000,
      dateRange: [new Date(2020, 0, 1), new Date()],
      tags: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleQuickFilter = (type: string) => {
    switch (type) {
      case 'golden':
        setLocalFilters(prev => ({
          ...prev,
          goldenScoreRange: [GOLDEN_SCORE_THRESHOLDS.GOOD, 1000],
        }));
        break;
      case 'lowCompetition':
        setLocalFilters(prev => ({
          ...prev,
          competitionLevels: ['낮음'],
        }));
        break;
      case 'highVolume':
        setLocalFilters(prev => ({
          ...prev,
          searchVolumeMin: SEARCH_VOLUME_RANGES.HIGH,
        }));
        break;
      case 'noDocs':
        setLocalFilters(prev => ({
          ...prev,
          docCountMax: 0,
        }));
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>필터</span>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={handleApplyFilters}>
              적용
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetFilters}>
              초기화
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 검색어 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키워드 검색
          </label>
          <Input
            type="text"
            placeholder="키워드명으로 검색..."
            value={localFilters.searchTerm}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>

        {/* 황금점수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            황금점수 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소값"
              value={localFilters.goldenScoreRange[0]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                goldenScoreRange: [parseInt(e.target.value) || 0, prev.goldenScoreRange[1]]
              }))}
            />
            <Input
              type="number"
              placeholder="최대값"
              value={localFilters.goldenScoreRange[1]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                goldenScoreRange: [prev.goldenScoreRange[0], parseInt(e.target.value) || 1000]
              }))}
            />
          </div>
        </div>

        {/* 경쟁도 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            경쟁도
          </label>
          <div className="space-y-2">
            {COMPETITION_LEVELS.map((level) => (
              <label key={level} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.competitionLevels.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setLocalFilters(prev => ({
                        ...prev,
                        competitionLevels: [...prev.competitionLevels, level]
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        competitionLevels: prev.competitionLevels.filter(l => l !== level)
                      }));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 검색량 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            검색량 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소 검색량"
              value={localFilters.searchVolumeMin}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                searchVolumeMin: parseInt(e.target.value) || 0
              }))}
            />
            <Input
              type="number"
              placeholder="최대 검색량"
              value={localFilters.searchVolumeMax}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                searchVolumeMax: parseInt(e.target.value) || 1000000
              }))}
            />
          </div>
        </div>

        {/* 총 문서수 최대값 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            총 문서수 최대값
          </label>
          <Input
            type="number"
            placeholder="최대 문서수"
            value={localFilters.docCountMax}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              docCountMax: parseInt(e.target.value) || 1000000
            }))}
          />
        </div>

        {/* 카페 문서수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카페 문서수 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소값"
              value={localFilters.cafeCountMin}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                cafeCountMin: parseInt(e.target.value) || 0
              }))}
            />
            <Input
              type="number"
              placeholder="최대값"
              value={localFilters.cafeCountMax}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                cafeCountMax: parseInt(e.target.value) || 1000000
              }))}
            />
          </div>
        </div>

        {/* 블로그 문서수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            블로그 문서수 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소값"
              value={localFilters.blogCountMin}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                blogCountMin: parseInt(e.target.value) || 0
              }))}
            />
            <Input
              type="number"
              placeholder="최대값"
              value={localFilters.blogCountMax}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                blogCountMax: parseInt(e.target.value) || 1000000
              }))}
            />
          </div>
        </div>

        {/* 웹 문서수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            웹 문서수 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소값"
              value={localFilters.webCountMin}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                webCountMin: parseInt(e.target.value) || 0
              }))}
            />
            <Input
              type="number"
              placeholder="최대값"
              value={localFilters.webCountMax}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                webCountMax: parseInt(e.target.value) || 1000000
              }))}
            />
          </div>
        </div>

        {/* 뉴스 문서수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            뉴스 문서수 범위
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="최소값"
              value={localFilters.newsCountMin}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                newsCountMin: parseInt(e.target.value) || 0
              }))}
            />
            <Input
              type="number"
              placeholder="최대값"
              value={localFilters.newsCountMax}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                newsCountMax: parseInt(e.target.value) || 1000000
              }))}
            />
          </div>
        </div>

        {/* 퀵 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            퀵 필터
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickFilter('golden')}
            >
              💎 황금키워드
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickFilter('lowCompetition')}
            >
              🟢 저경쟁
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickFilter('highVolume')}
            >
              📈 고검색량
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickFilter('noDocs')}
            >
              📄 문서수 없음
            </Button>
          </div>
        </div>

        {/* 현재 필터 표시 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            활성 필터
          </label>
          <div className="flex flex-wrap gap-2">
            {localFilters.searchTerm && (
              <Badge variant="secondary">
                검색: {localFilters.searchTerm}
              </Badge>
            )}
            {localFilters.goldenScoreRange[0] > 0 && (
              <Badge variant="secondary">
                황금점수: {localFilters.goldenScoreRange[0]}+
              </Badge>
            )}
            {localFilters.competitionLevels.length < 3 && (
              <Badge variant="secondary">
                경쟁도: {localFilters.competitionLevels.join(', ')}
              </Badge>
            )}
            {localFilters.searchVolumeMin > 0 && (
              <Badge variant="secondary">
                검색량: {localFilters.searchVolumeMin}+
              </Badge>
            )}
            {localFilters.docCountMax < 1000000 && (
              <Badge variant="secondary">
                총문서수: {localFilters.docCountMax} 이하
              </Badge>
            )}
            {localFilters.cafeCountMin > 0 && (
              <Badge variant="secondary">
                카페: {localFilters.cafeCountMin}+
              </Badge>
            )}
            {localFilters.blogCountMin > 0 && (
              <Badge variant="secondary">
                블로그: {localFilters.blogCountMin}+
              </Badge>
            )}
            {localFilters.webCountMin > 0 && (
              <Badge variant="secondary">
                웹: {localFilters.webCountMin}+
              </Badge>
            )}
            {localFilters.newsCountMin > 0 && (
              <Badge variant="secondary">
                뉴스: {localFilters.newsCountMin}+
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
