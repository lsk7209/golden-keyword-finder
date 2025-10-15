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
  console.log('🔍 파싱 함수 시작 - 입력 데이터:', data);
  
  if (!data.keywordList || !Array.isArray(data.keywordList)) {
    console.log('❌ keywordList가 없거나 배열이 아닙니다:', data.keywordList);
    return [];
  }

  console.log('📝 파싱할 keywordList 길이:', data.keywordList.length);
  
  const results = data.keywordList.map((item: Record<string, unknown>, index: number) => {
    console.log(`🔍 아이템 ${index} 파싱:`, item);
    console.log(`- relKeyword:`, item.relKeyword);
    console.log(`- monthlyPcQcCnt:`, item.monthlyPcQcCnt);
    console.log(`- monthlyMobileQcCnt:`, item.monthlyMobileQcCnt);
    
    const parsed = {
      keyword: String(item.relKeyword || ''),
      monthlyPcQcCnt: String(item.monthlyPcQcCnt || '0'),
      monthlyMobileQcCnt: String(item.monthlyMobileQcCnt || '0'),
      monthlyAvePcClkCnt: String(item.monthlyAvePcClkCnt || '0'),
      monthlyAveMobileClkCnt: String(item.monthlyAveMobileClkCnt || '0'),
      monthlyAvePcCtr: String(item.monthlyAvePcCtr || '0'),
      monthlyAveMobileCtr: String(item.monthlyAveMobileCtr || '0'),
      plAvgDepth: String(item.plAvgDepth || '0'),
      compIdx: String(item.compIdx || '낮음'),
    };
    
    console.log(`✅ 파싱된 아이템 ${index}:`, parsed);
    return parsed;
  });
  
  console.log('🎯 최종 파싱 결과:', results.length, '개');
  return results;
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
    
    console.log('네이버 API 요청 상세:', {
      baseUrl,
      uri,
      fullUrl: url,
      environmentVars: {
        SEARCHAD_BASE_URL: process.env.SEARCHAD_BASE_URL || '미설정',
        SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
        SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
        SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      },
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
    console.log('🔍 네이버 API 응답 데이터 전체:', JSON.stringify(data, null, 2));
    
    // 응답 구조 상세 분석
    console.log('📊 응답 구조 분석:');
    console.log('- 전체 키:', Object.keys(data));
    console.log('- keywordList 타입:', typeof data.keywordList);
    console.log('- keywordList 존재 여부:', !!data.keywordList);
    
    if (data.keywordList) {
      console.log('✅ keywordList 존재:', data.keywordList.length, '개');
      if (data.keywordList.length > 0) {
        console.log('📝 keywordList 샘플 (첫 번째):', JSON.stringify(data.keywordList[0], null, 2));
        console.log('📝 keywordList 샘플 (두 번째):', data.keywordList[1] ? JSON.stringify(data.keywordList[1], null, 2) : '없음');
      } else {
        console.log('⚠️ keywordList가 빈 배열입니다!');
      }
    } else {
      console.log('❌ keywordList가 없습니다!');
      console.log('🔍 대안 키들 확인:');
      Object.keys(data).forEach(key => {
        console.log(`- ${key}:`, typeof data[key], Array.isArray(data[key]) ? `(배열, ${data[key].length}개)` : '');
      });
    }
    
    // 에러 응답 확인
    if (data.error) {
      console.error('❌ 네이버 API 에러:', data.error);
      throw new Error(`네이버 API 에러: ${data.error}`);
    }
    
    // 빈 응답 확인
    if (!data.keywordList || data.keywordList.length === 0) {
      console.warn('⚠️ 키워드가 반환되지 않았습니다. 시드키워드를 확인해주세요.');
      console.log('🔍 요청한 시드키워드:', seedKeywords);
      console.log('🔍 전체 응답:', data);
      
      // 빈 결과라도 빈 배열 반환 (에러가 아님)
      return [];
    }
    
    const parsedResults = parseKeywordResults(data);
    console.log('✅ 파싱된 키워드 결과:', parsedResults.length, '개');
    
    if (parsedResults.length === 0 && data.keywordList.length > 0) {
      console.error('❌ 키워드가 파싱되지 않았습니다!');
      console.log('🔍 원본 keywordList:', data.keywordList);
      console.log('🔍 파싱 함수 확인 필요');
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
