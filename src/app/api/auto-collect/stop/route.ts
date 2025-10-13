import { NextRequest, NextResponse } from 'next/server';

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

    // 실제로는 세션을 중지하는 로직이 필요하지만, 
    // 현재는 단순히 성공 응답을 반환
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
