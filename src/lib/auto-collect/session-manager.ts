// 세션 상태 타입 정의
export interface SessionState {
  status: 'running' | 'completed' | 'error' | 'stopped' | 'not_found';
  target_count: number;
  current_seed_keywords: string[];
  used_seed_keywords: string[];
  message: string;
  logs: string[];
  updated_at?: string;
}

// 전역 세션 상태 관리 (실제로는 Redis나 데이터베이스 사용 권장)
const sessionStates = new Map<string, SessionState>();

// 세션 상태 업데이트 함수
export function updateSessionState(sessionId: string, updates: Partial<SessionState>) {
  const currentState = sessionStates.get(sessionId) || {} as SessionState;
  const newState = { ...currentState, ...updates, updated_at: new Date().toISOString() };
  sessionStates.set(sessionId, newState);
  console.log(`🔄 세션 상태 업데이트: ${sessionId}`, updates);
}

// 세션 상태 가져오기 함수
export function getSessionState(sessionId: string): SessionState | undefined {
  return sessionStates.get(sessionId);
}

// 모든 세션 상태 가져오기 함수
export function getAllSessionStates(): Map<string, SessionState> {
  return sessionStates;
}

// 세션 삭제 함수
export function deleteSession(sessionId: string) {
  sessionStates.delete(sessionId);
  console.log(`🗑️ 세션 삭제: ${sessionId}`);
}
