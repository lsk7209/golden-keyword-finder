'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

export function usePersistentBackgroundSave() {
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

  const workerRef = useRef<Worker | null>(null);
  const saveInProgress = useRef(false);

  // Web Worker 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker('/background-save-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'PROGRESS') {
          setSaveProgress(prev => ({
            ...prev,
            current: data.current,
            completed: data.completed,
            failed: data.failed,
          }));
        } else if (type === 'COMPLETE') {
          setSaveProgress(prev => ({
            ...prev,
            isActive: false,
          }));
          
          // 완료 알림
          if (data.completed > 0) {
            setSaveNotification({
              show: true,
              message: `✅ ${data.completed}개 키워드가 백그라운드에서 자동 저장되었습니다${data.failed > 0 ? ` (${data.failed}개 실패)` : ''}`,
              type: data.failed > 0 ? 'error' : 'success',
            });

            // 7초 후 알림 자동 숨김
            setTimeout(() => {
              setSaveNotification(prev => ({ ...prev, show: false }));
            }, 7000);
          }
          
          saveInProgress.current = false;
          console.log(`백그라운드 자동 저장 완료: ${data.completed}개 성공, ${data.failed}개 실패`);
        }
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // IndexedDB에 저장할 키워드 저장
  const saveToIndexedDB = useCallback(async (keywords: NaverKeyword[]) => {
    if (typeof window === 'undefined') return;

    try {
      const dbName = 'KeywordSaveQueue';
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keywords')) {
          db.createObjectStore('keywords', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['keywords'], 'readwrite');
        const store = transaction.objectStore('keywords');

        keywords.forEach((keyword, index) => {
          store.add({
            ...keyword,
            timestamp: Date.now(),
            index,
          });
        });
      };
    } catch (error) {
      console.error('IndexedDB 저장 오류:', error);
    }
  }, []);

  // IndexedDB에서 저장할 키워드 로드
  const loadFromIndexedDB = useCallback(async (): Promise<NaverKeyword[]> => {
    if (typeof window === 'undefined') return [];

    return new Promise((resolve) => {
      const dbName = 'KeywordSaveQueue';
      const request = indexedDB.open(dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['keywords'], 'readonly');
        const store = transaction.objectStore('keywords');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const keywords = getAllRequest.result.map(item => ({
            keyword: item.keyword,
            monthlyPcQcCnt: item.monthlyPcQcCnt,
            monthlyMobileQcCnt: item.monthlyMobileQcCnt,
            monthlyAvePcClkCnt: item.monthlyAvePcClkCnt,
            monthlyAveMobileClkCnt: item.monthlyAveMobileClkCnt,
            monthlyAvePcCtr: item.monthlyAvePcCtr,
            monthlyAveMobileCtr: item.monthlyAveMobileCtr,
            plAvgDepth: item.plAvgDepth,
            compIdx: item.compIdx,
          }));
          resolve(keywords);
        };

        getAllRequest.onerror = () => {
          resolve([]);
        };
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }, []);

  // IndexedDB에서 저장된 키워드 삭제
  const clearIndexedDB = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const dbName = 'KeywordSaveQueue';
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['keywords'], 'readwrite');
      const store = transaction.objectStore('keywords');
      store.clear();
    };
  }, []);

  // 백그라운드 저장 시작
  const startPersistentBackgroundSave = useCallback(async (keywords: NaverKeyword[]) => {
    if (keywords.length === 0 || saveInProgress.current) return;

    saveInProgress.current = true;
    
    // IndexedDB에 저장
    await saveToIndexedDB(keywords);
    
    setSaveProgress({
      isActive: true,
      current: 0,
      total: keywords.length,
      completed: 0,
      failed: 0,
    });

    console.log(`지속적 백그라운드 자동 저장 시작: ${keywords.length}개`);

    // Web Worker로 백그라운드 저장 시작
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SAVE_KEYWORDS',
        data: {
          keywords,
        }
      });
    }
  }, [saveToIndexedDB]);

  // 페이지 로드 시 미완료된 저장 작업 복구
  const recoverPendingSaves = useCallback(async () => {
    const pendingKeywords = await loadFromIndexedDB();
    
    if (pendingKeywords.length > 0) {
      console.log(`미완료된 저장 작업 복구: ${pendingKeywords.length}개`);
      await startPersistentBackgroundSave(pendingKeywords);
    }
  }, [loadFromIndexedDB, startPersistentBackgroundSave]);

  return {
    saveProgress,
    saveNotification,
    startPersistentBackgroundSave,
    recoverPendingSaves,
  };
}
