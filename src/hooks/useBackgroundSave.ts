'use client';

import { useState, useCallback, useRef } from 'react';
import { NaverKeyword } from '@/types/keyword';

interface SaveProgress {
  isActive: boolean;
  current: number;
  total: number;
  completed: number;
  failed: number;
}

interface SaveNotification {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useBackgroundSave() {
  const [saveProgress, setSaveProgress] = useState<SaveProgress>({
    isActive: false,
    current: 0,
    total: 0,
    completed: 0,
    failed: 0,
  });
  
  const [saveNotification, setSaveNotification] = useState<SaveNotification>({
    show: false,
    message: '',
    type: 'info',
  });

  const saveInProgress = useRef(false);

  const handleSave = useCallback(async (keyword: NaverKeyword) => {
    const response = await fetch('/api/keywords/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(keyword),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '저장에 실패했습니다.');
    }
    
    return result;
  }, []);

  const startBackgroundSave = useCallback(async (keywords: NaverKeyword[]) => {
    if (keywords.length === 0 || saveInProgress.current) return;

    saveInProgress.current = true;
    
    setSaveProgress({
      isActive: true,
      current: 0,
      total: keywords.length,
      completed: 0,
      failed: 0,
    });

    console.log(`백그라운드 자동 저장 시작: ${keywords.length}개`);

    // 백그라운드에서 저장 실행
    setTimeout(async () => {
      let completed = 0;
      let failed = 0;

      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        
        setSaveProgress(prev => ({
          ...prev,
          current: i + 1,
        }));

        try {
          await handleSave(keyword);
          console.log(`키워드 저장 완료: ${keyword.keyword}`);
          completed++;
          
          setSaveProgress(prev => ({
            ...prev,
            completed,
          }));
        } catch (error) {
          console.error(`키워드 저장 실패: ${keyword.keyword}`, error);
          failed++;
          
          setSaveProgress(prev => ({
            ...prev,
            failed,
          }));
        }

        // 저장 간격을 두어 서버 부하 방지
        if (i < keywords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setSaveProgress(prev => ({
        ...prev,
        isActive: false,
      }));

      // 저장 완료 알림
      if (completed > 0) {
        setSaveNotification({
          show: true,
          message: `✅ ${completed}개 키워드가 백그라운드에서 자동 저장되었습니다${failed > 0 ? ` (${failed}개 실패)` : ''}`,
          type: failed > 0 ? 'error' : 'success',
        });

        // 5초 후 알림 자동 숨김
        setTimeout(() => {
          setSaveNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }

      saveInProgress.current = false;
      console.log(`백그라운드 자동 저장 완료: ${completed}개 성공, ${failed}개 실패`);
    }, 100); // 100ms 후 시작
  }, [handleSave]);

  return {
    saveProgress,
    saveNotification,
    startBackgroundSave,
  };
}
