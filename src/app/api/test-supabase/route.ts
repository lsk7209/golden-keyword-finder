import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. 연결 테스트
    console.log('Supabase 연결 테스트 시작...');

    // 2. 테이블 존재 확인
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'keywords');

    if (tableError) {
      console.error('테이블 조회 오류:', tableError);
      return NextResponse.json({
        success: false,
        error: '테이블 조회 실패',
        details: tableError.message
      });
    }

    // 3. 키워드 테이블에서 데이터 조회
    const { data: keywords, error: keywordError, count } = await supabase
      .from('keywords')
      .select('*', { count: 'exact' })
      .limit(5);

    if (keywordError) {
      console.error('키워드 조회 오류:', keywordError);
      return NextResponse.json({
        success: false,
        error: '키워드 조회 실패',
        details: keywordError.message
      });
    }

    // 4. 통계 조회
    const { count: totalCount, error: countError } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        tableExists: tables && tables.length > 0,
        totalKeywords: totalCount || 0,
        sampleKeywords: keywords || [],
        message: 'Supabase 연결 및 데이터 조회 성공'
      }
    });

  } catch (error) {
    console.error('Supabase 테스트 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Supabase 연결 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
}
