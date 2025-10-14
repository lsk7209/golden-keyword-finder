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

// 전역 세션 상태 관리 (메모리 기반)
const sessionStates = new Map<string, SessionState>();

// 세션 생성 함수
export async function createSession(sessionId: string, initialData: Partial<SessionState>) {
  try {
    const sessionData: SessionState = {
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

    sessionStates.set(sessionId, sessionData);
    console.log(`✅ 세션 생성: ${sessionId}`, sessionData);
    return sessionData;
  } catch (error) {
    console.error('세션 생성 실패:', error);
    throw error;
  }
}

// 세션 상태 업데이트 함수
export function updateSessionState(sessionId: string, updates: Partial<SessionState>) {
  const currentState = sessionStates.get(sessionId);
  if (currentState) {
    const newState = { ...currentState, ...updates, updated_at: new Date().toISOString() };
    sessionStates.set(sessionId, newState);
    console.log(`🔄 세션 상태 업데이트: ${sessionId}`, updates);
  }
}

// 세션 상태 가져오기 함수
export function getSessionState(sessionId: string): SessionState | null {
  return sessionStates.get(sessionId) || null;
}

// 세션 삭제 함수
export function deleteSession(sessionId: string) {
  sessionStates.delete(sessionId);
  console.log(`🗑️ 세션 삭제: ${sessionId}`);
}
