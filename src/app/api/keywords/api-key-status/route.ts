import { NextResponse } from 'next/server';
import { apiKeyPool } from '@/lib/naver/api-key-pool';
import { openApiKeyPool } from '@/lib/naver/openapi-key-pool';

export async function GET() {
  try {
    const searchAdStatus = apiKeyPool.getStatus();
    const openApiStatus = openApiKeyPool.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        searchAdKeys: {
          total: searchAdStatus.length,
          available: searchAdStatus.filter(key => key.isAvailable).length,
          status: searchAdStatus
        },
        openApiKeys: {
          total: openApiStatus.length,
          available: openApiStatus.filter(key => key.isAvailable).length,
          status: openApiStatus
        }
      }
    });
  } catch (error) {
    console.error('API 키 상태 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'API 키 상태를 조회할 수 없습니다.'
    }, { status: 500 });
  }
}
