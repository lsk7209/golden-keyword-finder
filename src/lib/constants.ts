export const COMPETITION_LEVELS = ['낮음', '중간', '높음'] as const;

export const GOLDEN_SCORE_THRESHOLDS = {
  EXCELLENT: 100,
  GOOD: 50,
  FAIR: 20,
  POOR: 0,
} as const;

export const SEARCH_VOLUME_RANGES = {
  VERY_HIGH: 100000,
  HIGH: 10000,
  MEDIUM: 1000,
  LOW: 100,
  VERY_LOW: 0,
} as const;

export const DOCUMENT_COUNT_RANGES = {
  VERY_HIGH: 1000000,
  HIGH: 100000,
  MEDIUM: 10000,
  LOW: 1000,
  VERY_LOW: 0,
} as const;

export const API_LIMITS = {
  NAVER_SEARCHAD_DAILY: 1000,
  NAVER_OPENAPI_DAILY: 25000,
  BATCH_SIZE: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const TABLE_COLUMNS = [
  { key: 'checkbox', label: '선택', sortable: false },
  { key: 'keyword', label: '키워드', sortable: true },
  { key: 'monthlyPcQcCnt', label: 'PC 검색수', sortable: true },
  { key: 'monthlyMobileQcCnt', label: '모바일 검색수', sortable: true },
  { key: 'totalSearchVolume', label: '총 검색수', sortable: true },
  { key: 'monthlyAvePcCtr', label: 'PC CTR(%)', sortable: true },
  { key: 'monthlyAveMobileCtr', label: '모바일 CTR(%)', sortable: true },
  { key: 'plAvgDepth', label: '광고수', sortable: true },
  { key: 'compIdx', label: '경쟁도', sortable: true },
  { key: 'blogCount', label: '블로그', sortable: true },
  { key: 'cafeCount', label: '카페', sortable: true },
  { key: 'webCount', label: '웹문서', sortable: true },
  { key: 'newsCount', label: '뉴스', sortable: true },
  { key: 'totalDocCount', label: '총 문서수', sortable: true },
  { key: 'goldenScore', label: '황금점수', sortable: true },
  { key: 'createdAt', label: '수집일', sortable: true },
  { key: 'actions', label: '액션', sortable: false },
] as const;
