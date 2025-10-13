'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AutoCollectSectionProps {
  onStartAutoCollect: (targetCount: number) => void;
  onStopAutoCollect: () => void;
  isAutoCollecting: boolean;
  currentCount: number;
  targetCount: number;
  currentSeedKeywords: string[];
  collectedKeywords: string[];
}

export function AutoCollectSection({
  onStartAutoCollect,
  onStopAutoCollect,
  isAutoCollecting,
  currentCount,
  targetCount,
  currentSeedKeywords,
  collectedKeywords,
}: AutoCollectSectionProps) {
  const [targetInput, setTargetInput] = useState(100);

  const handleStart = () => {
    onStartAutoCollect(targetInput);
  };

  const progress = targetCount > 0 ? Math.min((currentCount / targetCount) * 100, 100) : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold text-gray-800">
          🤖 자동 키워드 수집
        </CardTitle>
        <p className="text-center text-gray-600">
          연관검색어를 시드키워드로 설정하여 자동으로 키워드를 수집합니다
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 목표 키워드 수 설정 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            목표 키워드 수
          </label>
          <Input
            type="number"
            placeholder="목표 키워드 수"
            value={targetInput}
            onChange={(e) => setTargetInput(parseInt(e.target.value) || 0)}
            disabled={isAutoCollecting}
            min="10"
            max="1000"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            최소 10개, 최대 1000개까지 설정 가능합니다
          </p>
        </div>

        {/* 진행 상황 */}
        {isAutoCollecting && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">진행 상황</span>
              <span className="text-sm text-gray-600">
                {currentCount} / {targetCount} ({progress.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 현재 시드키워드 */}
        {currentSeedKeywords.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 시드키워드
            </label>
            <div className="flex flex-wrap gap-2">
              {currentSeedKeywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {currentSeedKeywords.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{currentSeedKeywords.length - 5}개 더
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 수집된 키워드 미리보기 */}
        {collectedKeywords.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수집된 키워드 ({collectedKeywords.length}개)
            </label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {collectedKeywords.slice(0, 20).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {collectedKeywords.length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{collectedKeywords.length - 20}개 더
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 제어 버튼 */}
        <div className="flex gap-2">
          {!isAutoCollecting ? (
            <Button
              onClick={handleStart}
              disabled={targetInput < 10}
              className="flex-1"
              size="lg"
            >
              🚀 자동 수집 시작
            </Button>
          ) : (
            <Button
              onClick={onStopAutoCollect}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              ⏹️ 자동 수집 중지
            </Button>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 자동 수집은 수동으로 수집된 연관검색어를 시드키워드로 사용합니다</p>
          <p>• 목표 키워드 수에 도달하거나 더 이상 수집할 키워드가 없으면 중지됩니다</p>
          <p>• 각 단계마다 문서수도 자동으로 조회됩니다</p>
        </div>
      </CardContent>
    </Card>
  );
}
