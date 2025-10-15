import { useState, useCallback, useRef, useEffect } from 'react';

interface AutoCollectState {
  isRunning: boolean;
  currentCount: number;
  targetCount: number;
  currentSeedKeywords: string[];
  usedSeedKeywords: string[];
  message: string;
  logs: string[];
}

export function useAutoCollectWorker() {
  const [state, setState] = useState<AutoCollectState>({
    isRunning: false,
    currentCount: 0,
    targetCount: 0,
    currentSeedKeywords: [],
    usedSeedKeywords: [],
    message: '자동 수집을 시작하세요.',
    logs: [],
  });

  const workerRef = useRef<Worker | null>(null);

  // Worker 초기화
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(new URL('../workers/auto-collect.worker.ts', import.meta.url));
      
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            setState(prev => ({
              ...prev,
              currentCount: data.current,
              targetCount: data.target,
              message: `수집 진행 중: ${data.current} / ${data.target} (${data.percentage}%)`,
            }));
            break;
            
          case 'LOG':
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, data],
            }));
            break;
            
          case 'COMPLETE':
            setState(prev => ({
              ...prev,
              isRunning: false,
              message: `수집 완료! 총 ${data.totalCollected}개 키워드 수집됨`,
            }));
            break;
            
          case 'ERROR':
            setState(prev => ({
              ...prev,
              isRunning: false,
              message: `오류 발생: ${data}`,
            }));
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker 오류:', error);
        setState(prev => ({
          ...prev,
          isRunning: false,
          message: 'Worker 오류가 발생했습니다.',
        }));
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startAutoCollect = useCallback((seedKeywords: string[], targetCount: number) => {
    if (!workerRef.current || state.isRunning) return;

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentCount: seedKeywords.length,
      targetCount,
      currentSeedKeywords: seedKeywords,
      usedSeedKeywords: [],
      message: '자동 수집이 시작되었습니다.',
      logs: [`🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`],
    }));

    workerRef.current.postMessage({
      type: 'START_AUTO_COLLECT',
      data: { seedKeywords, targetCount }
    });
  }, [state.isRunning]);

  const stopAutoCollect = useCallback(() => {
    if (!workerRef.current || !state.isRunning) return;

    workerRef.current.postMessage({
      type: 'STOP_AUTO_COLLECT'
    });

    setState(prev => ({
      ...prev,
      isRunning: false,
      message: '자동 수집이 중지되었습니다.',
    }));
  }, [state.isRunning]);

  const addLog = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, message],
    }));
  }, []);

  return {
    ...state,
    startAutoCollect,
    stopAutoCollect,
    addLog,
  };
}
