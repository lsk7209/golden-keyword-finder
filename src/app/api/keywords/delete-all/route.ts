import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 모든 키워드 삭제 요청 시작');

    // 모든 키워드 삭제
    const { error, count } = await supabase
      .from('keywords')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제 (neq 조건으로 모든 행 선택)

    if (error) {
      console.error('키워드 삭제 오류:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: '키워드 삭제 중 오류가 발생했습니다.',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log(`🗑️ 키워드 삭제 완료: ${count}개 삭제됨`);

    return NextResponse.json({
      success: true,
      message: `모든 키워드가 삭제되었습니다. (${count}개)`,
      deletedCount: count
    });

  } catch (error) {
    console.error('예상치 못한 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예상치 못한 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
