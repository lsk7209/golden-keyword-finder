// 자동 수집을 위한 Web Worker
// 메인 스레드를 블로킹하지 않고 백그라운드에서 실행

interface AutoCollectMessage {
  type: 'START_AUTO_COLLECT' | 'STOP_AUTO_COLLECT';
  data?: {
    seedKeywords: string[];
    targetCount: number;
  };
}

interface AutoCollectResponse {
  type: 'PROGRESS' | 'LOG' | 'COMPLETE' | 'ERROR';
  data: unknown;
}

class AutoCollectWorker {
  private isRunning = false;
  private allCollectedKeywords = new Set<string>();
  private usedAsSeedKeywords = new Set<string>();
  private currentCount = 0;
  private targetCount = 0;

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<AutoCollectMessage>) {
    const { type, data } = event.data;

    switch (type) {
      case 'START_AUTO_COLLECT':
        if (data) {
          this.startAutoCollect(data.seedKeywords, data.targetCount);
        }
        break;
      case 'STOP_AUTO_COLLECT':
        this.stopAutoCollect();
        break;
    }
  }

  private async startAutoCollect(seedKeywords: string[], targetCount: number) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.allCollectedKeywords = new Set(seedKeywords);
    this.usedAsSeedKeywords = new Set(seedKeywords);
    this.currentCount = seedKeywords.length;
    this.targetCount = targetCount;

    this.sendMessage('LOG', `🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`);

    // 기존 키워드들을 데이터베이스에서 가져오기
    try {
      this.sendMessage('LOG', '📊 기존 키워드 데이터 로딩 중...');
      
      const response = await fetch('/api/keywords/stats');
      if (response.ok) {
        const data = await response.json();
        const existingKeywords = data.keywords || [];
        const existingKeywordSet = new Set<string>(existingKeywords.map((k: { keyword: string }) => k.keyword));
        
        // 기존 키워드들과 초기 시드키워드들을 합치기
        this.allCollectedKeywords = new Set([...existingKeywordSet, ...seedKeywords]);
        this.usedAsSeedKeywords = new Set(seedKeywords);
        
        this.sendMessage('LOG', `📊 기존 키워드 ${existingKeywordSet.size}개 로드됨`);
        this.sendMessage('LOG', `🌱 사용 가능한 시드키워드: ${existingKeywordSet.size}개 (기존) + ${seedKeywords.length}개 (초기) = ${this.allCollectedKeywords.size}개`);
      } else {
        this.sendMessage('LOG', '⚠️ 기존 키워드 로드 실패, 초기 시드키워드만 사용');
      }
    } catch {
      this.sendMessage('LOG', '⚠️ 기존 키워드 로드 중 오류, 초기 시드키워드만 사용');
    }

    // 자동 수집 루프 시작
    this.collectLoop();
  }

  private async collectLoop() {
    while (this.isRunning && this.currentCount < this.targetCount) {
      try {
        // 사용 가능한 시드키워드 선택
        const availableForSeed = Array.from(this.allCollectedKeywords).filter(
          keyword => !this.usedAsSeedKeywords.has(keyword)
        );

        this.sendMessage('LOG', `🔍 전체 키워드: ${this.allCollectedKeywords.size}개, 사용된 시드: ${this.usedAsSeedKeywords.size}개, 사용 가능: ${availableForSeed.length}개`);

        if (availableForSeed.length === 0) {
          this.sendMessage('LOG', '❌ 더 이상 사용할 수 있는 시드키워드가 없습니다.');
          this.sendMessage('LOG', `📊 디버그 정보: 전체=${this.allCollectedKeywords.size}, 사용됨=${this.usedAsSeedKeywords.size}`);
          this.stopAutoCollect();
          return;
        }

        // 시드키워드 선택 (최대 3개) - 랜덤하게 선택하여 다양성 확보
        const shuffled = [...availableForSeed].sort(() => Math.random() - 0.5);
        const selectedSeeds = shuffled.slice(0, 3);
        this.sendMessage('LOG', `🌱 선택된 시드키워드: ${selectedSeeds.join(', ')}`);

        // 선택된 키워드를 사용된 키워드에 추가
        selectedSeeds.forEach(keyword => this.usedAsSeedKeywords.add(keyword));

        // 네이버 API로 연관키워드 검색
        this.sendMessage('LOG', '🔍 네이버 API 호출 중...');
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

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'API 호출 실패');
        }

        const relatedKeywords = result.data?.relatedKeywords || [];
        this.sendMessage('LOG', `🔍 검색된 연관키워드: ${relatedKeywords.length}개`);

        // 새로운 키워드만 필터링
        const newKeywords = relatedKeywords.filter((k: { keyword: string }) => 
          !this.allCollectedKeywords.has(k.keyword)
        );

        if (newKeywords.length > 0) {
          // 새로운 키워드들을 수집된 키워드에 추가
          newKeywords.forEach((k: { keyword: string }) => {
            this.allCollectedKeywords.add(k.keyword);
          });

          this.currentCount = this.allCollectedKeywords.size;
          this.sendMessage('LOG', `✅ 새로운 키워드 ${newKeywords.length}개 추가됨 (총 ${this.currentCount}개)`);
          
          // 진행률 업데이트
          this.sendMessage('PROGRESS', {
            current: this.currentCount,
            target: this.targetCount,
            percentage: Math.round((this.currentCount / this.targetCount) * 100 * 100) / 100
          });
        } else {
          this.sendMessage('LOG', '⚠️ 새로운 키워드가 없습니다.');
        }

        // API 호출 간격 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.sendMessage('LOG', `❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        // 오류 발생 시 잠시 대기 후 계속
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (this.currentCount >= this.targetCount) {
      this.sendMessage('LOG', `🎉 목표 달성! 총 ${this.currentCount}개 키워드 수집 완료`);
      this.sendMessage('COMPLETE', {
        totalCollected: this.currentCount,
        target: this.targetCount
      });
    }
  }

  private stopAutoCollect() {
    this.isRunning = false;
    this.sendMessage('LOG', '⏹️ 자동 수집 중지됨');
  }

  private sendMessage(type: AutoCollectResponse['type'], data: unknown) {
    self.postMessage({ type, data });
  }
}

// Worker 초기화
new AutoCollectWorker();
