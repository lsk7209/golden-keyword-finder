'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchOptions } from '@/types/keyword';
import { validateSearchInput, parseSearchKeywords } from '@/lib/utils';

interface SearchSectionProps {
  onSearch: (options: SearchOptions) => void;
  isLoading: boolean;
}

export function SearchSection({ onSearch, isLoading }: SearchSectionProps) {
  const [input, setInput] = useState('');
  const [showDetail, setShowDetail] = useState(true);
  const [autoFetchDocs, setAutoFetchDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    const validation = validateSearchInput(input);
    if (!validation.isValid) {
      setError(validation.message || '입력값이 올바르지 않습니다.');
      return;
    }

    setError(null);
    const keywords = parseSearchKeywords(input);
    onSearch({
      seedKeywords: keywords,
      showDetail,
      autoFetchDocs,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-800">
          🎯 황금키워드 파인더
        </CardTitle>
        <p className="text-center text-gray-600">
          네이버 검색 데이터로 황금키워드를 발견하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="keywords" className="text-sm font-medium">
            시드 키워드 (최대 5개, 쉼표로 구분)
          </label>
          <Input
            id="keywords"
            type="text"
            placeholder="예: 마케팅, SEO, 블로그"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showDetail"
              checked={showDetail}
              onChange={(e) => setShowDetail(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showDetail" className="text-sm">
              상세 지표 포함 (CTR, 클릭수 등)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoFetchDocs"
              checked={autoFetchDocs}
              onChange={(e) => setAutoFetchDocs(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="autoFetchDocs" className="text-sm">
              자동으로 문서수 조회 (시간이 오래 걸릴 수 있음)
            </label>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>검색 중...</span>
            </div>
          ) : (
            '🔍 키워드 검색'
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>• 네이버 검색광고 API를 사용하여 연관키워드를 조회합니다</p>
          <p>• 황금점수 = 총검색량 ÷ 총문서수 (높을수록 좋음)</p>
        </div>
      </CardContent>
    </Card>
  );
}
