import { useState, useCallback, useRef } from 'react';

interface AutoCollectState {
  isRunning: boolean;
  currentCount: number;
  targetCount: number;
  currentSeedKeywords: string[];
  usedSeedKeywords: string[];
  message: string;
  logs: string[];
}

export function useAutoCollect() {
  const [state, setState] = useState<AutoCollectState>({
    isRunning: false,
    currentCount: 0,
    targetCount: 0,
    currentSeedKeywords: [],
    usedSeedKeywords: [],
    message: '',
    logs: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const allCollectedKeywords = useRef<Set<string>>(new Set());
  const usedAsSeedKeywords = useRef<Set<string>>(new Set());

  const addLog = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-9), message], // 최근 10개 로그만 유지
    }));
  }, []);

  const stopAutoCollect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      message: '자동 수집이 중지되었습니다.',
    }));

    addLog('⏹️ 자동 수집 중지됨');
    console.log('🛑 클라이언트 자동 수집 중지');
  }, [addLog]);

  const startAutoCollect = useCallback(async (seedKeywords: string[], targetCount: number) => {
    if (state.isRunning) return;

    console.log('🚀 클라이언트 자동 수집 시작');
    
    // 기존 키워드들을 데이터베이스에서 가져오기
    addLog('📊 기존 키워드 데이터 로딩 중...');
    try {
      const response = await fetch('/api/keywords/stats');
      if (response.ok) {
        const data = await response.json();
        const existingKeywords = data.keywords || [];
        const existingKeywordSet = new Set(existingKeywords.map((k: { keyword: string }) => k.keyword));
        
        // 기존 키워드들과 초기 시드키워드들을 합치기
        allCollectedKeywords.current = new Set([...existingKeywordSet, ...seedKeywords]);
        usedAsSeedKeywords.current = new Set(seedKeywords); // 초기 시드키워드들만 사용된 것으로 표시
        
        addLog(`📊 기존 키워드 ${existingKeywordSet.size}개 로드됨`);
      } else {
        // 실패시 초기 시드키워드만 사용
        allCollectedKeywords.current = new Set(seedKeywords);
        usedAsSeedKeywords.current = new Set(seedKeywords);
        addLog('⚠️ 기존 키워드 로드 실패, 초기 시드키워드만 사용');
      }
    } catch {
      // 에러시 초기 시드키워드만 사용
      allCollectedKeywords.current = new Set(seedKeywords);
      usedAsSeedKeywords.current = new Set(seedKeywords);
      addLog('⚠️ 기존 키워드 로드 중 오류, 초기 시드키워드만 사용');
    }
    
    setState({
      isRunning: true,
      currentCount: seedKeywords.length,
      targetCount,
      currentSeedKeywords: seedKeywords,
      usedSeedKeywords: [],
      message: '자동 수집이 시작되었습니다.',
      logs: [`🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`],
    });

    addLog('🔄 자동 수집 프로세스 시작');

    // 자동 수집 로직 실행
    const collectKeywords = async () => {
      try {
        // 사용 가능한 시드키워드 선택
        const availableForSeed = Array.from(allCollectedKeywords.current).filter(
          keyword => !usedAsSeedKeywords.current.has(keyword)
        );

        if (availableForSeed.length === 0) {
          addLog('❌ 더 이상 사용할 수 있는 시드키워드가 없습니다.');
          stopAutoCollect();
          return;
        }

        // 시드키워드 선택 (최대 3개) - 랜덤하게 선택하여 다양성 확보
        const shuffled = [...availableForSeed].sort(() => Math.random() - 0.5);
        const selectedSeeds = shuffled.slice(0, 3);
        addLog(`🌱 선택된 시드키워드: ${selectedSeeds.join(', ')}`);

        // 선택된 키워드를 사용된 키워드에 추가
        selectedSeeds.forEach(keyword => usedAsSeedKeywords.current.add(keyword));

        // 네이버 API로 연관키워드 검색
        addLog('🔍 네이버 API 호출 중...');
        const response = await fetch('/api/keywords/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            seedKeywords: selectedSeeds,
            showDetail: true,
            autoFetchDocs: true 
          }),
        });

        if (!response.ok) {
          throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();
        const relatedKeywords = data.data || [];

        if (relatedKeywords.length === 0) {
          addLog('⚠️ 연관키워드 검색 결과가 없습니다.');
          return;
        }

        addLog(`🔍 검색된 연관키워드: ${relatedKeywords.length}개`);

        // 새로운 키워드만 필터링
        const newKeywords = relatedKeywords.filter(
          (keyword: { keyword: string }) => !allCollectedKeywords.current.has(keyword.keyword)
        );

        if (newKeywords.length === 0) {
          addLog('⚠️ 새로운 키워드가 없습니다.');
          return;
        }

        addLog(`✨ 새로운 키워드: ${newKeywords.length}개`);

        // 새로운 키워드를 데이터베이스에 저장
        const saveResponse = await fetch('/api/keywords/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: newKeywords }),
        });

        if (!saveResponse.ok) {
          throw new Error(`키워드 저장 실패: ${saveResponse.status}`);
        }

        // 수집된 키워드를 allCollectedKeywords에 추가
        newKeywords.forEach((k: { keyword: string }) => allCollectedKeywords.current.add(k.keyword));
        
        const newCount = allCollectedKeywords.current.size;
        
        setState(prev => ({
          ...prev,
          currentCount: newCount,
          currentSeedKeywords: selectedSeeds,
          usedSeedKeywords: Array.from(usedAsSeedKeywords.current),
          message: `${newKeywords.length}개 키워드 저장 완료! 총 수집: ${newCount}개`,
        }));

        addLog(`✅ ${newKeywords.length}개 키워드 저장 완료! 총 수집: ${newCount}개`);

        // 목표 달성 확인
        if (newCount >= targetCount) {
          addLog(`🎉 목표 달성! 총 ${newCount}개 키워드 수집 완료`);
          stopAutoCollect();
          return;
        }

      } catch (error) {
        console.error('자동 수집 오류:', error);
        addLog(`❌ 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    // 첫 번째 수집 실행
    await collectKeywords();

    // 5초마다 자동 수집 실행
    intervalRef.current = setInterval(async () => {
      if (allCollectedKeywords.current.size >= targetCount) {
        stopAutoCollect();
        return;
      }
      await collectKeywords();
    }, 5000);

  }, [state.isRunning, addLog, stopAutoCollect]);

  return {
    ...state,
    startAutoCollect,
    stopAutoCollect,
  };
}
