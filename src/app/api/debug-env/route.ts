import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 모든 환경 변수 상태 확인
    const envStatus = {
      // 검색광고 API
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
      
      // 추가 검색광고 API
      SEARCHAD_API_KEY_2: process.env.SEARCHAD_API_KEY_2 ? '설정됨' : '미설정',
      SEARCHAD_SECRET_2: process.env.SEARCHAD_SECRET_2 ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID_2: process.env.SEARCHAD_CUSTOMER_ID_2 ? '설정됨' : '미설정',
      
      SEARCHAD_API_KEY_3: process.env.SEARCHAD_API_KEY_3 ? '설정됨' : '미설정',
      SEARCHAD_SECRET_3: process.env.SEARCHAD_SECRET_3 ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID_3: process.env.SEARCHAD_CUSTOMER_ID_3 ? '설정됨' : '미설정',
      
      // 오픈 API
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '미설정',
      
      // 추가 오픈 API
      NAVER_CLIENT_ID_2: process.env.NAVER_CLIENT_ID_2 ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET_2: process.env.NAVER_CLIENT_SECRET_2 ? '설정됨' : '미설정',
      
      NAVER_CLIENT_ID_4: process.env.NAVER_CLIENT_ID_4 ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET_4: process.env.NAVER_CLIENT_SECRET_4 ? '설정됨' : '미설정',
      
      NAVER_CLIENT_ID_5: process.env.NAVER_CLIENT_ID_5 ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET_5: process.env.NAVER_CLIENT_SECRET_5 ? '설정됨' : '미설정',
      
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '미설정',
    };

    // 실제 값의 길이 확인 (보안을 위해 값 자체는 노출하지 않음)
    const valueLengths = {
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY?.length || 0,
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET?.length || 0,
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID?.length || 0,
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID?.length || 0,
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET?.length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        environment: envStatus,
        valueLengths,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('환경 변수 디버깅 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '환경 변수 디버깅 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
