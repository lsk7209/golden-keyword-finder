import { NextResponse } from 'next/server';
import { getSearchAdHeaders } from '@/lib/naver/searchad';
import { getDocumentCounts } from '@/lib/naver/documents';

export async function GET() {
  try {
    // 환경변수 확인
    const envCheck = {
      // 네이버 검색광고 API
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      SEARCHAD_BASE_URL: process.env.SEARCHAD_BASE_URL || '미설정',
      // 네이버 오픈 API
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '미설정',
      NAVER_OPENAPI_BASE_URL: process.env.NAVER_OPENAPI_BASE_URL || '미설정',
    };

    console.log('환경변수 상태:', envCheck);

    // 네이버 API 테스트 요청
    const uri = '/keywordstool';
    const params = new URLSearchParams({
      hintKeywords: '홍대갈만한곳',
      showDetail: '1',
    });

    const baseUrl = process.env.SEARCHAD_BASE_URL || 'https://api.naver.com';
    const url = `${baseUrl}${uri}?${params}`;
    const headers = getSearchAdHeaders('GET', uri);

    console.log('네이버 API 요청 URL:', url);
    console.log('네이버 API 요청 헤더:', {
      'X-Timestamp': headers['X-Timestamp'],
      'X-API-KEY': headers['X-API-KEY'] ? '설정됨' : '미설정',
      'X-Customer': headers['X-Customer'],
      'X-Signature': headers['X-Signature'] ? '설정됨' : '미설정',
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('네이버 검색광고 API 응답 상태:', response.status, response.statusText);

    let searchAdResponseData;
    if (response.ok) {
      searchAdResponseData = await response.json();
      console.log('네이버 검색광고 API 응답 데이터:', JSON.stringify(searchAdResponseData, null, 2));
    } else {
      const errorText = await response.text();
      console.error('네이버 검색광고 API 오류 응답:', errorText);
      searchAdResponseData = { error: errorText };
    }

    // 네이버 오픈 API 테스트 (문서수 조회)
    console.log('네이버 오픈 API 테스트 시작...');
    let openApiResponseData;
    try {
      const documentCounts = await getDocumentCounts('홍대갈만한곳');
      openApiResponseData = { success: true, data: documentCounts };
      console.log('네이버 오픈 API 응답:', documentCounts);
    } catch (error) {
      console.error('네이버 오픈 API 오류:', error);
      openApiResponseData = { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }

    return NextResponse.json({
      success: true,
      data: {
        environment: envCheck,
        request: {
          url,
          headers: {
            'X-Timestamp': headers['X-Timestamp'],
            'X-API-KEY': headers['X-API-KEY'] ? '설정됨' : '미설정',
            'X-Customer': headers['X-Customer'],
            'X-Signature': headers['X-Signature'] ? '설정됨' : '미설정',
          },
        },
        searchAdApi: {
          status: response.status,
          statusText: response.statusText,
          data: searchAdResponseData,
        },
        openApi: {
          data: openApiResponseData,
        },
      },
    });

  } catch (error) {
    console.error('네이버 API 테스트 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
