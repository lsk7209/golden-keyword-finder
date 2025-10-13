import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 임시 상태 반환 (실제로는 메모리나 데이터베이스에서 관리)
    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId,
        status: 'running', // running, completed, error, stopped
        current_count: 0, // 현재 수집된 키워드 수
        target_count: 0, // 목표 키워드 수
        seed_keywords: [], // 현재 시드키워드
        used_seed_keywords: [], // 사용된 시드키워드
        message: '새로운 자동 수집 시스템이 실행 중입니다.',
      },
    });

  } catch (error) {
    console.error('상태 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 확인에 실패했습니다.' },
      { status: 500 }
    );
  }
}
