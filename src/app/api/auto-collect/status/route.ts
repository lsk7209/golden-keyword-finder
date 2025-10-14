import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionState } from '@/lib/auto-collect/session-manager';

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

    console.log(`📊 상태 확인 요청: ${sessionId}`);

    // 세션 상태 가져오기
    const sessionState = getSessionState(sessionId);
    
    if (!sessionState) {
      console.log(`❌ 세션을 찾을 수 없음: ${sessionId}`);
      return NextResponse.json({
        success: true,
        data: {
          sessionId: sessionId,
          status: 'not_found',
          current_count: 0,
          target_count: 0,
          seed_keywords: [],
          used_seed_keywords: [],
          message: '세션을 찾을 수 없습니다.',
        },
      });
    }

    // 데이터베이스에서 실제 키워드 수 확인
    const supabase = await createClient();
    const { count, error } = await (supabase as any)
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    const actualCount = error ? 0 : (count || 0);

    console.log(`📈 세션 상태: ${sessionState.status}, 실제 키워드 수: ${actualCount}`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId,
        status: sessionState.status,
        current_count: actualCount,
        target_count: sessionState.target_count || 0,
        seed_keywords: sessionState.current_seed_keywords || [],
        used_seed_keywords: sessionState.used_seed_keywords || [],
        message: sessionState.message || '자동 수집이 진행 중입니다.',
        logs: sessionState.logs || [],
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
