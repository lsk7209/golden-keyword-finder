/**
 * 네이버 오픈 API 키 풀 관리 시스템
 * 여러 API 키를 순환 사용하여 병렬 처리 및 속도 향상
 */

export interface OpenApiKeyConfig {
  clientId: string;
  clientSecret: string;
  name: string; // 디버깅용 이름
  lastUsed?: number; // 마지막 사용 시간
  requestCount: number; // 요청 횟수
  errorCount: number; // 오류 횟수
}

export class OpenApiKeyPool {
  private keys: OpenApiKeyConfig[] = [];
  private currentIndex = 0;
  private readonly maxRequestsPerKey = 1000; // 키당 최대 요청 수 (오픈 API는 제한이 더 관대함)
  private readonly cooldownTime = 30000; // 30초 쿨다운

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // 환경 변수에서 여러 오픈 API 키 로드
    const keyConfigs = [
      {
        name: 'OpenAPI-Primary',
        clientId: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
      },
      {
        name: 'OpenAPI-Secondary',
        clientId: process.env.NAVER_CLIENT_ID_2,
        clientSecret: process.env.NAVER_CLIENT_SECRET_2,
      },
      {
        name: 'OpenAPI-Tertiary',
        clientId: process.env.NAVER_CLIENT_ID_3,
        clientSecret: process.env.NAVER_CLIENT_SECRET_3,
      },
      {
        name: 'OpenAPI-Quaternary',
        clientId: process.env.NAVER_CLIENT_ID_4,
        clientSecret: process.env.NAVER_CLIENT_SECRET_4,
      },
    ];

    // 유효한 키만 추가
    this.keys = keyConfigs
      .filter(config => config.clientId && config.clientSecret)
      .map(config => ({
        ...config,
        requestCount: 0,
        errorCount: 0,
      }));

    console.log(`🔑 네이버 오픈 API 키 풀 초기화: ${this.keys.length}개 키 사용 가능`);
  }

  /**
   * 사용 가능한 API 키 가져오기 (로드 밸런싱)
   */
  getAvailableKey(): OpenApiKeyConfig | null {
    if (this.keys.length === 0) {
      console.warn('⚠️ 사용 가능한 네이버 오픈 API 키가 없습니다');
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
      console.warn('⚠️ 모든 네이버 오픈 API 키가 쿨다운 중이거나 제한에 도달했습니다');
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
  markKeyUsed(key: OpenApiKeyConfig, success: boolean) {
    key.lastUsed = Date.now();
    key.requestCount++;
    
    if (!success) {
      key.errorCount++;
    }

    console.log(`🔑 네이버 오픈 API 키 "${key.name}" 사용 완료: ${success ? '성공' : '실패'} (요청: ${key.requestCount}, 오류: ${key.errorCount})`);
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

  private isKeyAvailable(key: OpenApiKeyConfig): boolean {
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
    console.log('🔄 네이버 오픈 API 키 풀 리셋 완료');
  }
}

// 싱글톤 인스턴스
export const openApiKeyPool = new OpenApiKeyPool();
