import crypto from 'crypto';

/**
 * 네이버 검색광고 API 서명 생성
 * HMAC-SHA256(secret, "{timestamp}.{METHOD}.{URI}") → Base64 인코딩
 */
export function generateSignature(
  timestamp: string,
  method: string,
  uri: string,
  secret: string
): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
}

/**
 * 네이버 검색광고 API 요청 헤더 생성
 */
export function getSearchAdHeaders(method: string, uri: string) {
  const timestamp = Date.now().toString();
  
  // URI 인코딩 확인
  const encodedUri = encodeURIComponent(uri);
  console.log('서명 생성 정보:', {
    timestamp,
    method,
    uri,
    encodedUri,
    secret: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
  });
  
  return {
    'X-Timestamp': timestamp,
    'X-API-KEY': process.env.SEARCHAD_API_KEY!,
    'X-Customer': process.env.SEARCHAD_CUSTOMER_ID!,
    'X-Signature': generateSignature(
      timestamp,
      method,
      uri, // 원본 URI 사용 (인코딩하지 않음)
      process.env.SEARCHAD_SECRET!
    ),
    'Content-Type': 'application/json; charset=UTF-8',
  };
}

/**
 * RelKwdStat는 타 오퍼레이션 대비 호출 속도가 1/5~1/6 수준으로 제한
 * 429 발생 시 다른 API 대비 5~6배 긴 sleep 후 재시도
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * RelKwdStat 전용 백오프 시간 계산
 * 429 연속 시 최소 5분 쿨다운 권고
 */
export function getBackoffDelay(attempt: number): number {
  if (attempt === 1) return 5000; // 5초
  if (attempt === 2) return 15000; // 15초
  if (attempt === 3) return 30000; // 30초
  return 300000; // 5분
}
