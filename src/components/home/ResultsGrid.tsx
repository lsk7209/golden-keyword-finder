'use client';

import { KeywordCard } from './KeywordCard';
import { NaverKeyword } from '@/types/keyword';

interface ResultsGridProps {
  keywords: NaverKeyword[];
  onSave: (keyword: NaverKeyword) => void;
  onFetchDocs: (keyword: string) => void;
  isSaving?: boolean;
  isFetchingDocs?: boolean;
}

export function ResultsGrid({ 
  keywords, 
  onSave, 
  onFetchDocs, 
  isSaving = false,
  isFetchingDocs = false 
}: ResultsGridProps) {
  if (keywords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">검색 결과가 없습니다</h3>
        <p className="text-gray-500">다른 키워드로 검색해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          검색 결과 ({keywords.length}개)
        </h2>
        <p className="text-gray-600">
          연관키워드를 발견했습니다. 각 키워드를 저장하거나 문서수를 조회해보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keywords.map((keyword, index) => (
          <KeywordCard
            key={`${keyword.keyword}-${index}`}
            keyword={keyword}
            onSave={onSave}
            onFetchDocs={onFetchDocs}
            isSaving={isSaving}
            isFetchingDocs={isFetchingDocs}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>💡 팁: 황금점수가 높은 키워드일수록 경쟁이 적고 검색량이 높은 키워드입니다.</p>
      </div>
    </div>
  );
}
