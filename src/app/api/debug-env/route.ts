import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envStatus = {
      // Supabase
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정',
      
      // Naver Search Ad API
      SEARCHAD_API_KEY: process.env.SEARCHAD_API_KEY ? '설정됨' : '미설정',
      SEARCHAD_CUSTOMER_ID: process.env.SEARCHAD_CUSTOMER_ID ? '설정됨' : '미설정',
      SEARCHAD_SECRET: process.env.SEARCHAD_SECRET ? '설정됨' : '미설정',
      SEARCHAD_BASE_URL: process.env.SEARCHAD_BASE_URL || '미설정',
      
      // Naver Open API (문서수 수집용)
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? '설정됨' : '미설정',
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '미설정',
    };

    return NextResponse.json({
      success: true,
      data: envStatus,
    });
  } catch (error) {
    console.error('환경변수 확인 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '환경변수 확인 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
