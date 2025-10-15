// 자동 수집을 위한 Web Worker
// 메인 스레드를 블로킹하지 않고 백그라운드에서 실행
// 버전: 2024-10-15-v3 (시드키워드 사용 문제 해결)

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
    this.usedAsSeedKeywords = new Set(); // 초기에는 아무것도 사용된 것으로 표시하지 않음
    this.currentCount = seedKeywords.length;
    this.targetCount = targetCount;

    this.sendMessage('LOG', `🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`);

    // 기존 키워드들을 데이터베이스에서 가져오기 (선택사항)
    try {
      this.sendMessage('LOG', '📊 기존 키워드 데이터 로딩 중...');
      
      const response = await fetch('/api/keywords/stats');
      if (response.ok) {
        const data = await response.json();
        this.sendMessage('LOG', `📊 API 응답 데이터: ${JSON.stringify(data).substring(0, 200)}...`);
        
        const existingKeywords = data.keywords || [];
        this.sendMessage('LOG', `📊 기존 키워드 배열 길이: ${existingKeywords.length}`);
        
        if (Array.isArray(existingKeywords) && existingKeywords.length > 0) {
          const existingKeywordSet = new Set<string>(existingKeywords.map((k: { keyword: string }) => k.keyword));
          
          // 기존 키워드들과 초기 시드키워드들을 합치기
          this.allCollectedKeywords = new Set([...existingKeywordSet, ...seedKeywords]);
          // 초기 시드키워드만 사용된 것으로 표시 (기존 키워드들은 새로운 시드로 사용 가능)
          this.usedAsSeedKeywords = new Set(seedKeywords);
          
          this.sendMessage('LOG', `📊 기존 키워드 ${existingKeywordSet.size}개 로드됨`);
          this.sendMessage('LOG', `🌱 사용 가능한 시드키워드: ${existingKeywordSet.size}개 (기존) + ${seedKeywords.length}개 (초기) = ${this.allCollectedKeywords.size}개`);
        } else {
          this.sendMessage('LOG', '📊 기존 키워드가 없거나 빈 배열입니다.');
          // 기존 키워드가 없으면 초기 시드키워드만 사용
          this.usedAsSeedKeywords = new Set();
        }
      } else {
        this.sendMessage('LOG', `⚠️ API 응답 실패: ${response.status} ${response.statusText}`);
        // 실패 시에는 아무것도 사용된 것으로 표시하지 않음 (초기 시드키워드도 사용 가능)
        this.usedAsSeedKeywords = new Set();
      }
    } catch (error) {
      this.sendMessage('LOG', `⚠️ 기존 키워드 로드 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      // 오류 시에는 아무것도 사용된 것으로 표시하지 않음 (초기 시드키워드도 사용 가능)
      this.usedAsSeedKeywords = new Set();
    }

    // 자동 수집 루프 시작
    this.collectLoop();
  }

  private async collectLoop() {
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;

    while (this.isRunning && this.currentCount < this.targetCount) {
      try {
        // 사용 가능한 시드키워드 선택
        const availableForSeed = Array.from(this.allCollectedKeywords).filter(
          keyword => !this.usedAsSeedKeywords.has(keyword)
        );

        this.sendMessage('LOG', `🔍 전체 키워드: ${this.allCollectedKeywords.size}개, 사용된 시드: ${this.usedAsSeedKeywords.size}개, 사용 가능: ${availableForSeed.length}개`);
        this.sendMessage('LOG', `🔍 전체 키워드 목록: ${Array.from(this.allCollectedKeywords).slice(0, 10).join(', ')}${this.allCollectedKeywords.size > 10 ? '...' : ''}`);
        this.sendMessage('LOG', `🔍 사용된 시드 목록: ${Array.from(this.usedAsSeedKeywords).slice(0, 10).join(', ')}${this.usedAsSeedKeywords.size > 10 ? '...' : ''}`);
        this.sendMessage('LOG', `🔍 사용 가능한 시드 목록: ${availableForSeed.slice(0, 10).join(', ')}${availableForSeed.length > 10 ? '...' : ''}`);

        if (availableForSeed.length === 0) {
          this.sendMessage('LOG', '❌ 더 이상 사용할 수 있는 시드키워드가 없습니다.');
          this.sendMessage('LOG', `📊 디버그 정보: 전체=${this.allCollectedKeywords.size}, 사용됨=${this.usedAsSeedKeywords.size}`);
          
          // 연속 실패가 너무 많으면 중지
          if (consecutiveFailures >= maxConsecutiveFailures) {
            this.sendMessage('LOG', `⏹️ 연속 실패 ${consecutiveFailures}회로 인한 자동 수집 중지`);
            this.stopAutoCollect();
            return;
          }
          
          // 사용된 키워드 중 일부를 다시 사용 가능하게 만들기
          const usedArray = Array.from(this.usedAsSeedKeywords);
          if (usedArray.length > 0) {
            // 마지막 5개를 제외하고 나머지를 다시 사용 가능하게 설정
            const toReuse = usedArray.slice(0, Math.max(0, usedArray.length - 5));
            toReuse.forEach(keyword => this.usedAsSeedKeywords.delete(keyword));
            this.sendMessage('LOG', `🔄 이전 시드키워드 ${toReuse.length}개를 다시 사용 가능하게 설정`);
            continue;
          }
          
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
          
          // 배치 저장 API로 키워드 저장
          try {
            this.sendMessage('LOG', '💾 키워드 배치 저장 중...');
            const saveResponse = await fetch('/api/keywords/save-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newKeywords),
            });

            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              this.sendMessage('LOG', `💾 배치 저장 성공: ${saveResult.data?.saved || 0}개 저장됨`);
            } else {
              this.sendMessage('LOG', `⚠️ 배치 저장 실패: ${saveResponse.status}`);
            }
          } catch (saveError) {
            this.sendMessage('LOG', `⚠️ 배치 저장 오류: ${saveError instanceof Error ? saveError.message : '알 수 없는 오류'}`);
          }
          
          // 성공 시 연속 실패 카운터 리셋
          consecutiveFailures = 0;
          
          // 진행률 업데이트
          this.sendMessage('PROGRESS', {
            current: this.currentCount,
            target: this.targetCount,
            percentage: Math.round((this.currentCount / this.targetCount) * 100 * 100) / 100
          });
        } else {
          this.sendMessage('LOG', '⚠️ 새로운 키워드가 없습니다.');
          consecutiveFailures++;
        }

        // API 호출 간격 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.sendMessage('LOG', `❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        consecutiveFailures++;
        
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
