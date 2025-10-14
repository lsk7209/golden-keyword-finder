import { createClient } from '@/lib/supabase/server';

// 세션 상태 타입 정의
export interface SessionState {
  id: string;
  status: 'running' | 'completed' | 'error' | 'stopped' | 'not_found';
  target_count: number;
  current_count: number;
  current_seed_keywords: string[];
  used_seed_keywords: string[];
  message: string;
  logs: string[];
  created_at: string;
  updated_at: string;
}

// 세션 상태 업데이트 함수 (데이터베이스 기반)
export async function updateSessionState(sessionId: string, updates: Partial<SessionState>) {
  try {
    const supabase = await createClient();
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from('auto_collect_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('세션 상태 업데이트 오류:', error);
      throw error;
    }

    console.log(`🔄 세션 상태 업데이트: ${sessionId}`, updates);
  } catch (error) {
    console.error('세션 상태 업데이트 실패:', error);
    throw error;
  }
}

// 세션 상태 가져오기 함수 (데이터베이스 기반)
export async function getSessionState(sessionId: string): Promise<SessionState | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await (supabase as any)
      .from('auto_collect_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드를 찾을 수 없음
        return null;
      }
      console.error('세션 상태 조회 오류:', error);
      throw error;
    }

    return data as SessionState;
  } catch (error) {
    console.error('세션 상태 조회 실패:', error);
    return null;
  }
}

// 세션 생성 함수
export async function createSession(sessionId: string, initialData: Partial<SessionState>) {
  try {
    const supabase = await createClient();
    
    const sessionData = {
      id: sessionId,
      status: 'running',
      target_count: 0,
      current_count: 0,
      current_seed_keywords: [],
      used_seed_keywords: [],
      message: '',
      logs: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...initialData,
    };

    const { error } = await (supabase as any)
      .from('auto_collect_sessions')
      .insert(sessionData);

    if (error) {
      console.error('세션 생성 오류:', error);
      throw error;
    }

    console.log(`✅ 세션 생성: ${sessionId}`, sessionData);
    return sessionData;
  } catch (error) {
    console.error('세션 생성 실패:', error);
    throw error;
  }
}

// 세션 삭제 함수
export async function deleteSession(sessionId: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase as any)
      .from('auto_collect_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('세션 삭제 오류:', error);
      throw error;
    }

    console.log(`🗑️ 세션 삭제: ${sessionId}`);
  } catch (error) {
    console.error('세션 삭제 실패:', error);
    throw error;
  }
}
