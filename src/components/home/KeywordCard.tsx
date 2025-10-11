'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NaverKeyword } from '@/types/keyword';
import { formatNumber, getCompetitionColor, parseNaverNumber } from '@/lib/utils';

interface KeywordCardProps {
  keyword: NaverKeyword;
  onSave: (keyword: NaverKeyword) => void;
  onFetchDocs: (keyword: string) => void;
  isSaving?: boolean;
  isFetchingDocs?: boolean;
}

export function KeywordCard({ 
  keyword, 
  onSave, 
  onFetchDocs, 
  isSaving = false,
  isFetchingDocs = false 
}: KeywordCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    try {
      await onSave(keyword);
      setIsSaved(true);
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  const handleFetchDocs = async () => {
    try {
      await onFetchDocs(keyword.keyword);
    } catch (error) {
      console.error('문서수 조회 실패:', error);
    }
  };

  const totalSearchVolume = parseNaverNumber(keyword.monthlyPcQcCnt) + parseNaverNumber(keyword.monthlyMobileQcCnt);
  const pcCtr = parseFloat(keyword.monthlyAvePcCtr) || 0;
  const mobileCtr = parseFloat(keyword.monthlyAveMobileCtr) || 0;
  const adCount = parseNaverNumber(keyword.plAvgDepth);

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {keyword.keyword}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 검색량 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">PC 검색수</p>
            <p className="font-semibold">{formatNumber(parseNaverNumber(keyword.monthlyPcQcCnt))}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">모바일 검색수</p>
            <p className="font-semibold">{formatNumber(parseNaverNumber(keyword.monthlyMobileQcCnt))}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">총 검색수</p>
          <p className="text-xl font-bold text-blue-600">{formatNumber(totalSearchVolume)}</p>
        </div>

        {/* CTR 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">PC CTR</p>
            <p className="font-semibold">{pcCtr.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">모바일 CTR</p>
            <p className="font-semibold">{mobileCtr.toFixed(2)}%</p>
          </div>
        </div>

        {/* 경쟁도 및 광고수 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">경쟁도</p>
            <Badge className={getCompetitionColor(keyword.compIdx)}>
              {keyword.compIdx}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">광고수</p>
            <p className="font-semibold">{adCount}개</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={handleFetchDocs}
            disabled={isFetchingDocs}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isFetchingDocs ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                <span>조회중</span>
              </div>
            ) : (
              '📄 문서수 조회'
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            size="sm"
            className="flex-1"
          >
            {isSaving ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span>저장중</span>
              </div>
            ) : isSaved ? (
              '✅ 저장됨'
            ) : (
              '💾 저장'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
