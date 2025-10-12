import { getSearchAdHeaders, sleep, getBackoffDelay } from './searchad';
import { NaverKeyword } from '@/types/keyword';

/**
 * 네이버 API 응답의 수치 데이터 정규화
 * "< 10" 같은 문자열은 기호 제거 후 숫자 변환
 */
export function parseNaverNumber(value: string): number {
  if (typeof value === 'string') {
    // "< 10" 같은 문자열 처리
    if (value.includes('<')) {
      return parseInt(value.replace(/[<\s]/g, '')) || 0;
    }
    return parseInt(value) || 0;
  }
  return parseInt(value as string) || 0;
}

/**
 * 네이버 API 응답 파싱 및 정규화
 */
export function parseKeywordResults(data: { keywordList?: Array<Record<string, unknown>> }): NaverKeyword[] {
  if (!data.keywordList || !Array.isArray(data.keywordList)) {
    return [];
  }

  return data.keywordList.map((item: Record<string, unknown>) => ({
    keyword: String(item.relKeyword || ''),
    monthlyPcQcCnt: String(item.monthlyPcQcCnt || '0'),
    monthlyMobileQcCnt: String(item.monthlyMobileQcCnt || '0'),
    monthlyAvePcClkCnt: String(item.monthlyAvePcClkCnt || '0'),
    monthlyAveMobileClkCnt: String(item.monthlyAveMobileClkCnt || '0'),
    monthlyAvePcCtr: String(item.monthlyAvePcCtr || '0'),
    monthlyAveMobileCtr: String(item.monthlyAveMobileCtr || '0'),
    plAvgDepth: String(item.plAvgDepth || '0'),
    compIdx: String(item.compIdx || '낮음'),
  }));
}

/**
 * 단일 배치 키워드 검색 (최대 5개)
 */
async function searchKeywordsBatch(
  seedKeywords: string[], 
  showDetail = true,
  attempt = 1
): Promise<NaverKeyword[]> {
  // 네이버 검색광고 API 엔드포인트 확인
  const uri = '/keywordstool';
  // 대안: '/keywordstool' 대신 다른 엔드포인트 시도
  // const uri = '/keywordstool/relkeyword';
  const params = new URLSearchParams({
    hintKeywords: seedKeywords.join(','),
    showDetail: showDetail ? '1' : '0',
  });
  
  console.log('네이버 API 파라미터:', {
    hintKeywords: seedKeywords.join(','),
    showDetail: showDetail ? '1' : '0',
    paramsString: params.toString(),
  });
  
  try {
    const baseUrl = process.env.SEARCHAD_BASE_URL || 'https://api.naver.com';
    const url = `${baseUrl}${uri}?${params}`;
    const headers = getSearchAdHeaders('GET', uri);
    
    console.log('네이버 API 요청:', {
      url,
      headers: {
        'X-Timestamp': headers['X-Timestamp'],
        'X-API-KEY': headers['X-API-KEY'] ? '설정됨' : '미설정',
        'X-Customer': headers['X-Customer'],
        'X-Signature': headers['X-Signature'] ? '설정됨' : '미설정',
      },
      params: params.toString(),
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log('네이버 API 응답 상태:', response.status, response.statusText);
    
    if (response.status === 429) {
      // RelKwdStat는 타 오퍼레이션 대비 호출 속도가 1/5~1/6 수준으로 제한
      const delay = getBackoffDelay(attempt);
      console.warn(`Rate limit hit, waiting ${delay}ms before retry (attempt ${attempt})`);
      await sleep(delay);
      
      if (attempt >= 3) {
        throw new Error('Rate limit exceeded. Please try again after 5 minutes.');
      }
      
      return searchKeywordsBatch(seedKeywords, showDetail, attempt + 1);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('네이버 API 오류 응답:', errorText);
      throw new Error(`네이버 API 오류: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('네이버 API 응답 데이터:', JSON.stringify(data, null, 2));
    
    // 응답 구조 상세 분석
    if (data.keywordList) {
      console.log('keywordList 존재:', data.keywordList.length, '개');
      console.log('keywordList 샘플:', data.keywordList.slice(0, 2));
    } else {
      console.log('keywordList가 없습니다. 응답 구조:', Object.keys(data));
    }
    
    const parsedResults = parseKeywordResults(data);
    console.log('파싱된 키워드 결과:', parsedResults.length, '개');
    
    if (parsedResults.length === 0) {
      console.log('키워드가 파싱되지 않았습니다. 원본 데이터:', data);
    }
    
    return parsedResults;
    
  } catch (error) {
    if (attempt >= 3) {
      throw error;
    }
    
    // 네트워크 오류 등으로 인한 재시도
    const delay = getBackoffDelay(attempt);
    console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt})`);
    await sleep(delay);
    return searchKeywordsBatch(seedKeywords, showDetail, attempt + 1);
  }
}

/**
 * 다중 키워드 검색 (5개 단위 배치 처리)
 * hintKeywords 최대 5개/호출 → 다량 키워드는 5개 단위 배치로 병렬/직렬 처리
 */
export async function searchKeywords(seedKeywords: string[], showDetail = true): Promise<NaverKeyword[]> {
  if (seedKeywords.length === 0) {
    return [];
  }

  // 5개 단위로 청크 분할
  const chunks: string[][] = [];
  for (let i = 0; i < seedKeywords.length; i += 5) {
    chunks.push(seedKeywords.slice(i, i + 5));
  }

  const results: NaverKeyword[] = [];
  
  // RelKwdStat는 속도 제한이 엄격하므로 순차 처리
  for (const chunk of chunks) {
    try {
      const chunkResults = await searchKeywordsBatch(chunk, showDetail);
      results.push(...chunkResults);
      
      // 청크 간 간격 (속도 제한 고려)
      if (chunks.length > 1) {
        await sleep(1000); // 1초 간격
      }
    } catch (error) {
      console.error(`Failed to process chunk: ${chunk.join(', ')}`, error);
      // 개별 청크 실패 시에도 다른 청크는 계속 처리
    }
  }

  return results;
}
