import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId') || 'anonymous';

    const supabase = createClient();

    if (sessionId) {
      // 특정 세션 조회
      const { data: session, error } = await supabase
        .from('auto_collect_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: '세션을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: session,
      });
    } else {
      // 사용자의 모든 세션 조회
      const { data: sessions, error } = await supabase
        .from('auto_collect_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: '세션 목록을 불러올 수 없습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: sessions,
      });
    }

  } catch (error) {
    console.error('자동 수집 상태 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
