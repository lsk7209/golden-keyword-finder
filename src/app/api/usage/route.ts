import { NextRequest, NextResponse } from 'next/server';
import { NaverApiUsageMonitor } from '@/lib/naver/documents';

export async function GET(request: NextRequest) {
  try {
    const usage = {
      count: NaverApiUsageMonitor.getUsageCount(),
      percentage: NaverApiUsageMonitor.getUsagePercentage(),
      limit: 25000,
      remaining: Math.max(0, 25000 - NaverApiUsageMonitor.getUsageCount()),
    };

    return NextResponse.json({
      success: true,
      data: usage,
    });

  } catch (error) {
    console.error('API 사용량 조회 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    NaverApiUsageMonitor.resetUsage();

    return NextResponse.json({
      success: true,
      message: 'API 사용량이 초기화되었습니다.',
    });

  } catch (error) {
    console.error('API 사용량 초기화 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
