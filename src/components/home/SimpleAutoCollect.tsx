'use client';

import { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoCollect } from '@/hooks/useAutoCollect';

interface SimpleAutoCollectProps {
  seedKeywords: string[];
}

export const SimpleAutoCollect = memo(function SimpleAutoCollect({ seedKeywords }: SimpleAutoCollectProps) {
  const [targetInput, setTargetInput] = useState<number>(100);
  const { 
    isRunning, 
    currentCount, 
    targetCount, 
    currentSeedKeywords, 
    usedSeedKeywords, 
    message, 
    logs,
    startAutoCollect, 
    stopAutoCollect 
  } = useAutoCollect();

  const handleStart = useCallback(() => {
    if (targetInput < 10) {
      alert('최소 10개 이상 설정해주세요.');
      return;
    }
    startAutoCollect(seedKeywords, targetInput);
  }, [targetInput, seedKeywords, startAutoCollect]);

  const handleStop = useCallback(() => {
    stopAutoCollect();
  }, [stopAutoCollect]);

  const progress = targetCount > 0 ? (currentCount / targetCount) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🤖 간단 자동 수집</CardTitle>
        <CardDescription>
          클라이언트에서 실행되는 간단한 자동 키워드 수집
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 목표 키워드 수 입력 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">목표 키워드 수</label>
          <Input
            type="number"
            placeholder="목표 키워드 수"
            value={targetInput}
            onChange={(e) => setTargetInput(parseInt(e.target.value) || 0)}
            disabled={isRunning}
            min="10"
            max="10000"
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            최소 10개, 최대 10,000개까지 설정 가능합니다
          </p>
        </div>

        {/* 시작/중지 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={isRunning || seedKeywords.length === 0}
            className="flex-1"
          >
            {isRunning ? '수집 중...' : '자동 수집 시작'}
          </Button>
          <Button
            onClick={handleStop}
            disabled={!isRunning}
            variant="outline"
            className="flex-1"
          >
            중지
          </Button>
        </div>

        {/* 진행 상황 */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>진행률</span>
              <span>{currentCount} / {targetCount} ({progress.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 현재 상태 */}
        {message && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}

        {/* 현재 시드키워드 */}
        {currentSeedKeywords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">현재 시드키워드</h4>
            <div className="flex flex-wrap gap-1">
              {currentSeedKeywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 사용된 시드키워드 */}
        {usedSeedKeywords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">사용된 시드키워드 ({usedSeedKeywords.length}개)</h4>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {usedSeedKeywords.slice(-10).map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
              {usedSeedKeywords.length > 10 && (
                <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">
                  +{usedSeedKeywords.length - 10}개 더
                </span>
              )}
            </div>
          </div>
        )}

        {/* 로그 */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">실행 로그</h4>
            <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs text-gray-600 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
