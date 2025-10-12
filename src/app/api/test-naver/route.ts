import { NextRequest, NextResponse } from 'next/server';
import { getSearchAdHeaders } from '@/lib/naver/searchad';

export async function GET(request: NextRequest) {
  try {
    // 환경변수 확인
    const envCheck = {
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      SEARCHAD_BASE_URL: process.env.SEARCHAD_BASE_URL || '미설정',
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

    console.log('네이버 API 응답 상태:', response.status, response.statusText);

    let responseData;
    if (response.ok) {
      responseData = await response.json();
      console.log('네이버 API 응답 데이터:', JSON.stringify(responseData, null, 2));
    } else {
      const errorText = await response.text();
      console.error('네이버 API 오류 응답:', errorText);
      responseData = { error: errorText };
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
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
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
