export interface Keyword {
  id: string;
  keyword: string;
  
  // 검색량 데이터
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalSearchVolume: number;
  
  // 클릭 데이터
  monthlyAvePcClkCnt: number;
  monthlyAveMobileClkCnt: number;
  
  // CTR 데이터
  monthlyAvePcCtr: number;
  monthlyAveMobileCtr: number;
  
  // 경쟁 데이터
  plAvgDepth: number;
  compIdx: '낮음' | '중간' | '높음';
  
  // 문서수 데이터
  blogCount: number;
  cafeCount: number;
  webCount: number;
  newsCount: number;
  totalDocCount: number;
  
  // 황금점수 (자동 계산)
  goldenScore: number;
  
  // 메타 데이터
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
  lastCheckedAt?: string;
}

export interface NaverKeyword {
  keyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
}

export interface DocumentCounts {
  blogCount: number;
  cafeCount: number;
  webCount: number;
  newsCount: number;
  totalDocCount: number;
}

export interface FilterOptions {
  searchTerm: string;
  goldenScoreRange: [number, number];
  competitionLevels: ('낮음' | '중간' | '높음')[];
  searchVolumeMin: number;
  searchVolumeMax: number;
  docCountMax: number;
  // 문서수 범위 필터
  cafeCountMin: number;
  cafeCountMax: number;
  blogCountMin: number;
  blogCountMax: number;
  webCountMin: number;
  webCountMax: number;
  newsCountMin: number;
  newsCountMax: number;
  dateRange: [Date, Date];
  tags: string[];
}

export interface SearchOptions {
  seedKeywords: string[];
  showDetail: boolean;
  autoFetchDocs: boolean;
}
