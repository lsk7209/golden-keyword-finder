import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();

    // 세션 상태를 중지로 업데이트
    const { data, error } = await supabase
      .from('auto_collect_sessions')
      // @ts-expect-error - auto_collect_sessions 테이블 타입이 아직 생성되지 않음
      .update({
        status: 'stopped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('자동 수집 중지 오류:', error);
      return NextResponse.json(
        { success: false, error: '자동 수집 중지에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '자동 수집이 중지되었습니다.',
        session: data,
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
