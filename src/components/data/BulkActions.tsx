'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onBulkFetchDocs: () => void;
}

export function BulkActions({ selectedCount, onBulkDelete, onClearSelection, onBulkFetchDocs }: BulkActionsProps) {
  const handleBulkDelete = () => {
    if (confirm(`선택된 ${selectedCount}개의 키워드를 삭제하시겠습니까?`)) {
      onBulkDelete();
    }
  };

  const handleBulkFetchDocs = () => {
    if (confirm(`선택된 ${selectedCount}개 키워드의 문서수를 조회하시겠습니까?\n\n⚠️ API 사용량: ${selectedCount * 4}회 (블로그, 카페, 웹문서, 뉴스 각각 조회)`)) {
      onBulkFetchDocs();
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="bg-blue-600">
            {selectedCount}개 선택됨
          </Badge>
          <span className="text-sm text-gray-600">
            선택된 키워드에 대해 작업을 수행할 수 있습니다.
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleBulkFetchDocs}
            variant="outline"
            size="sm"
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            📄 문서수 조회
          </Button>
          
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            size="sm"
          >
            🗑️ 선택 삭제
          </Button>
          
          <Button
            onClick={onClearSelection}
            variant="outline"
            size="sm"
          >
            선택 해제
          </Button>
        </div>
      </div>
    </div>
  );
}
