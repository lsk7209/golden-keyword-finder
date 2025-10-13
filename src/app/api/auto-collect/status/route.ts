import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 메모리에서 세션 상태 관리 (실제로는 Redis나 데이터베이스 사용 권장)
const sessionStates = new Map<string, any>();

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
    const sessionState = sessionStates.get(sessionId);
    
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
    const { count, error } = await supabase
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

// 세션 상태 업데이트 함수 (다른 모듈에서 사용)
export function updateSessionState(sessionId: string, updates: any) {
  const currentState = sessionStates.get(sessionId) || {};
  const newState = { ...currentState, ...updates, updated_at: new Date().toISOString() };
  sessionStates.set(sessionId, newState);
  console.log(`🔄 세션 상태 업데이트: ${sessionId}`, updates);
}

// 세션 상태 가져오기 함수
export function getSessionState(sessionId: string) {
  return sessionStates.get(sessionId);
}
