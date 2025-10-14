import { NextRequest, NextResponse } from 'next/server';
import { updateSessionState } from '@/lib/auto-collect/session-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🛑 자동 수집 중지 요청: ${sessionId}`);
    
    await updateSessionState(sessionId, {
      status: 'stopped',
      message: '자동 수집이 사용자 요청으로 중지되었습니다.',
      logs: [`⏹️ 자동 수집 중지됨 (사용자 요청)`],
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId,
        message: '자동 수집이 중지되었습니다.',
      },
    });

  } catch (error) {
    console.error('자동 수집 중지 오류:', error);
    return NextResponse.json(
      { success: false, error: '자동 수집 중지에 실패했습니다.' },
      { status: 500 }
    );
  }
}
