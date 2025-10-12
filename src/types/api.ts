export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchKeywordsRequest {
  seedKeywords: string[];
  showDetail: boolean;
}

export interface SearchKeywordsResponse {
  keywords: Array<{
    keyword: string;
    monthlyPcQcCnt: number;
    monthlyMobileQcCnt: number;
    monthlyAvePcClkCnt: number;
    monthlyAveMobileClkCnt: number;
    monthlyAvePcCtr: number;
    monthlyAveMobileCtr: number;
    plAvgDepth: number;
    compIdx: string;
  }>;
  saveResult?: {
    saved: number;
    failed: number;
    total: number;
  };
}

export interface FetchDocumentsRequest {
  keywords: string[];
}

export interface FetchDocumentsResponse {
  results: Array<{
    keyword: string;
    blogCount: number;
    cafeCount: number;
    webCount: number;
    newsCount: number;
    totalDocCount: number;
  }>;
}

export interface NaverApiError {
  errorCode: string;
  errorMessage: string;
}
