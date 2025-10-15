/**
 * 네이버 API 키 풀 관리 시스템
 * 여러 API 키를 순환 사용하여 병렬 처리 및 속도 향상
 */

export interface ApiKeyConfig {
  apiKey: string;
  secret: string;
  customerId: string;
  name: string; // 디버깅용 이름
  lastUsed?: number; // 마지막 사용 시간
  requestCount: number; // 요청 횟수
  errorCount: number; // 오류 횟수
}

export class ApiKeyPool {
  private keys: ApiKeyConfig[] = [];
  private currentIndex = 0;
  private readonly maxRequestsPerKey = 100; // 키당 최대 요청 수 (제한 방지)
  private readonly cooldownTime = 60000; // 1분 쿨다운

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // 환경 변수에서 여러 API 키 로드
    const keyConfigs = [
      {
        name: 'Primary',
        apiKey: process.env.SEARCHAD_API_KEY,
        secret: process.env.SEARCHAD_SECRET,
        customerId: process.env.SEARCHAD_CUSTOMER_ID,
      },
      {
        name: 'Secondary',
        apiKey: process.env.SEARCHAD_API_KEY_2,
        secret: process.env.SEARCHAD_SECRET_2,
        customerId: process.env.SEARCHAD_CUSTOMER_ID_2,
      },
      {
        name: 'Tertiary',
        apiKey: process.env.SEARCHAD_API_KEY_3,
        secret: process.env.SEARCHAD_SECRET_3,
        customerId: process.env.SEARCHAD_CUSTOMER_ID_3,
      },
    ];

    // 유효한 키만 추가
    this.keys = keyConfigs
      .filter(config => config.apiKey && config.secret && config.customerId)
      .map(config => ({
        name: config.name,
        apiKey: config.apiKey!,
        secret: config.secret!,
        customerId: config.customerId!,
        requestCount: 0,
        errorCount: 0,
      }));

    console.log(`🔑 API 키 풀 초기화: ${this.keys.length}개 키 사용 가능`);
  }

  /**
   * 사용 가능한 API 키 가져오기 (로드 밸런싱)
   */
  getAvailableKey(): ApiKeyConfig | null {
    if (this.keys.length === 0) {
      console.warn('⚠️ 사용 가능한 API 키가 없습니다');
      return null;
    }

    // 사용 가능한 키 찾기 (쿨다운 시간 고려)
    const now = Date.now();
    const availableKeys = this.keys.filter(key => {
      const isNotInCooldown = !key.lastUsed || (now - key.lastUsed) > this.cooldownTime;
      const isUnderLimit = key.requestCount < this.maxRequestsPerKey;
      const hasLowErrorRate = key.errorCount < key.requestCount * 0.1; // 10% 미만 오류율
      
      return isNotInCooldown && isUnderLimit && hasLowErrorRate;
    });

    if (availableKeys.length === 0) {
      console.warn('⚠️ 모든 API 키가 쿨다운 중이거나 제한에 도달했습니다');
      return null;
    }

    // 라운드 로빈 방식으로 키 선택
    const selectedKey = availableKeys[this.currentIndex % availableKeys.length];
    this.currentIndex++;

    return selectedKey;
  }

  /**
   * API 키 사용 완료 처리
   */
  markKeyUsed(key: ApiKeyConfig, success: boolean) {
    key.lastUsed = Date.now();
    key.requestCount++;
    
    if (!success) {
      key.errorCount++;
    }

    console.log(`🔑 API 키 "${key.name}" 사용 완료: ${success ? '성공' : '실패'} (요청: ${key.requestCount}, 오류: ${key.errorCount})`);
  }

  /**
   * 모든 키의 상태 정보 반환
   */
  getStatus() {
    return this.keys.map(key => ({
      name: key.name,
      requestCount: key.requestCount,
      errorCount: key.errorCount,
      errorRate: key.requestCount > 0 ? (key.errorCount / key.requestCount * 100).toFixed(1) + '%' : '0%',
      lastUsed: key.lastUsed ? new Date(key.lastUsed).toLocaleTimeString() : '사용 안함',
      isAvailable: this.isKeyAvailable(key),
    }));
  }

  private isKeyAvailable(key: ApiKeyConfig): boolean {
    const now = Date.now();
    const isNotInCooldown = !key.lastUsed || (now - key.lastUsed) > this.cooldownTime;
    const isUnderLimit = key.requestCount < this.maxRequestsPerKey;
    const hasLowErrorRate = key.errorCount < key.requestCount * 0.1;
    
    return isNotInCooldown && isUnderLimit && hasLowErrorRate;
  }

  /**
   * 키 풀 리셋 (테스트용)
   */
  reset() {
    this.keys.forEach(key => {
      key.requestCount = 0;
      key.errorCount = 0;
      key.lastUsed = undefined;
    });
    this.currentIndex = 0;
    console.log('🔄 API 키 풀 리셋 완료');
  }
}

// 싱글톤 인스턴스
export const apiKeyPool = new ApiKeyPool();
