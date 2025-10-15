import { NextRequest, NextResponse } from 'next/server';
import { apiKeyPool } from '@/lib/naver/api-key-pool';

export async function GET() {
  try {
    const status = apiKeyPool.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        totalKeys: status.length,
        availableKeys: status.filter(key => key.isAvailable).length,
        keys: status
      }
    });

  } catch (error) {
    console.error('API 키 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'API 키 상태 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
