import { DocumentCounts } from '@/types/keyword';

/**
 * 네이버 오픈 API 응답 타입
 */
export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: Array<{
    title: string;
    link: string;
    description: string;
    [key: string]: unknown;
  }>;
}

/**
 * 지수 백오프 재시도 함수
 * 4xx → 사용자 입력 검증, 429/500 → 지수백오프 (300ms → 600ms → 1200ms)
 */
export async function fetchWithRetry(
  url: string, 
  headers: Record<string, string>, 
  retries = 3
): Promise<NaverSearchResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
      
      if (response.status === 429) {
        // Rate limit: 25,000/day
        const delay = Math.min(300 * Math.pow(2, i), 5000); // 최대 5초
        console.warn(`Rate limit hit, waiting ${delay}ms before retry (attempt ${i + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (response.status >= 400 && response.status < 500) {
        // 4xx 오류는 재시도하지 않음
        const errorText = await response.text();
        throw new Error(`Client error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // 네트워크 오류 등으로 인한 재시도
      const delay = Math.min(300 * Math.pow(2, i), 5000);
      console.warn(`Request failed, retrying in ${delay}ms (attempt ${i + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * 단일 서비스 문서수 조회
 */
async function fetchServiceCount(
  service: 'blog' | 'cafearticle' | 'webkr' | 'news',
  keyword: string
): Promise<number> {
  const headers = {
    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
  };
  
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `${process.env.NAVER_OPENAPI_BASE_URL}/v1/search/${service}.json?query=${encodedKeyword}&display=1`;
  
  try {
    const data = await fetchWithRetry(url, headers);
    return data.total || 0;
  } catch (error) {
    console.error(`Failed to fetch ${service} count for "${keyword}":`, error);
    return 0;
  }
}

/**
 * 키워드별 문서수 조회 (병렬 처리)
 * 네이버 오픈 API: 하루 25,000회 (검색 API 전체 합산)
 */
export async function getDocumentCounts(keyword: string): Promise<DocumentCounts> {
  if (!keyword.trim()) {
    return {
      blogCount: 0,
      cafeCount: 0,
      webCount: 0,
      newsCount: 0,
      totalDocCount: 0,
    };
  }

  // 병렬 호출로 성능 최적화 (4개 서비스 동시 조회)
  const [blogCount, cafeCount, webCount, newsCount] = await Promise.all([
    fetchServiceCount('blog', keyword),
    fetchServiceCount('cafearticle', keyword),
    fetchServiceCount('webkr', keyword),
    fetchServiceCount('news', keyword),
  ]);
  
  return {
    blogCount,
    cafeCount,
    webCount,
    newsCount,
    totalDocCount: blogCount + cafeCount + webCount + newsCount,
  };
}

/**
 * 배치 문서수 조회 (순차 처리로 API 제한 고려)
 * 25,000회/일 사용량 모니터링 필요
 */
export async function getBatchDocumentCounts(
  keywords: string[]
): Promise<Array<{ keyword: string } & DocumentCounts>> {
  const results: Array<{ keyword: string } & DocumentCounts> = [];
  
  // API 제한을 고려하여 순차 처리 (동시성 제한)
  for (const keyword of keywords) {
    try {
      const counts = await getDocumentCounts(keyword);
      results.push({ keyword, ...counts });
      
      // 키워드 간 간격 (API 제한 고려)
      if (keywords.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms 간격
      }
    } catch (error) {
      console.error(`문서수 조회 실패 (${keyword}):`, error);
      results.push({
        keyword,
        blogCount: 0,
        cafeCount: 0,
        webCount: 0,
        newsCount: 0,
        totalDocCount: 0,
      });
    }
  }
  
  return results;
}

/**
 * API 사용량 모니터링 (개발용)
 */
export class NaverApiUsageMonitor {
  private static usageCount = 0;
  private static readonly DAILY_LIMIT = 25000;
  private static readonly WARNING_THRESHOLD = 0.8; // 80%

  static incrementUsage(count: number = 1): void {
    this.usageCount += count;
    
    if (this.usageCount >= this.DAILY_LIMIT * this.WARNING_THRESHOLD) {
      console.warn(`⚠️ 네이버 API 사용량 경고: ${this.usageCount}/${this.DAILY_LIMIT} (${Math.round(this.usageCount / this.DAILY_LIMIT * 100)}%)`);
    }
    
    if (this.usageCount >= this.DAILY_LIMIT) {
      console.error(`🚨 네이버 API 일일 한도 초과: ${this.usageCount}/${this.DAILY_LIMIT}`);
    }
  }

  static getUsageCount(): number {
    return this.usageCount;
  }

  static getUsagePercentage(): number {
    return (this.usageCount / this.DAILY_LIMIT) * 100;
  }

  static resetUsage(): void {
    this.usageCount = 0;
  }
}
