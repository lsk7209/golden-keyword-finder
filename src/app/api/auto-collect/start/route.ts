import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetCount, seedKeywords, userId = 'anonymous' } = body;

    if (!targetCount || !seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '목표 키워드 수와 시드키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 자동 수집 세션 생성
    const { data: session, error: sessionError } = await supabase
      .from('auto_collect_sessions')
      // @ts-expect-error - auto_collect_sessions 테이블 타입이 아직 생성되지 않음
      .insert({
        user_id: userId,
        target_count: targetCount,
        current_count: 0,
        seed_keywords: seedKeywords,
        used_seed_keywords: seedKeywords,
        status: 'running',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('자동 수집 세션 생성 오류:', sessionError);
      
      // auto_collect_sessions 테이블이 없는 경우 임시로 UUID 생성
      if (sessionError.code === '42P01') { // 테이블이 존재하지 않음
        const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 백그라운드에서 자동 수집 시작 (비동기)
        startBackgroundCollection(tempSessionId, seedKeywords, targetCount).catch(error => {
          console.error('백그라운드 자동 수집 오류:', error);
        });

        return NextResponse.json({
          success: true,
          data: {
            sessionId: tempSessionId,
            message: '자동 수집이 백그라운드에서 시작되었습니다. (임시 세션)',
          },
        });
      }
      
      return NextResponse.json(
        { success: false, error: '자동 수집 세션 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 백그라운드에서 자동 수집 시작 (비동기)
    // @ts-expect-error - session 타입이 아직 정의되지 않음
    startBackgroundCollection(session.id, seedKeywords, targetCount).catch(error => {
      console.error('백그라운드 자동 수집 오류:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        // @ts-expect-error - session 타입이 아직 정의되지 않음
        sessionId: session.id,
        message: '자동 수집이 백그라운드에서 시작되었습니다.',
      },
    });

  } catch (error) {
    console.error('자동 수집 시작 오류:', error);
    return NextResponse.json(
      { success: false, error: '자동 수집 시작에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 백그라운드 자동 수집 함수
async function startBackgroundCollection(sessionId: string, seedKeywords: string[], targetCount: number) {
  const supabase = await createClient();
  let currentSeedKeywords = [...seedKeywords];
  const usedSeedKeywords = new Set(seedKeywords);
  let currentCount = 0;

  try {
    while (currentCount < targetCount) {
      // 현재 시드키워드로 검색
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/keywords/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedKeywords: currentSeedKeywords,
          showDetail: true,
          autoFetchDocs: true,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const newKeywords = result.data.keywords;
        const newKeywordNames = newKeywords.map((k: { keyword: string }) => k.keyword);
        
        // 중복 제거하여 새로운 키워드만 추가
        const allUsedKeywords = Array.from(usedSeedKeywords);
        const uniqueNewKeywords = newKeywordNames.filter(
          (keyword: string) => !allUsedKeywords.includes(keyword)
        );

        if (uniqueNewKeywords.length > 0) {
          // 새로운 키워드를 데이터베이스에 저장
          const keywordObjects = newKeywords
            .filter((k: { keyword: string }) => uniqueNewKeywords.includes(k.keyword))
            .map((k: { 
              keyword: string; 
              monthlyPcQcCnt: string | number; 
              monthlyMobileQcCnt: string | number; 
              monthlyAvePcClkCnt: string | number; 
              monthlyAveMobileClkCnt: string | number; 
              monthlyAvePcCtr: string | number; 
              monthlyAveMobileCtr: string | number; 
              plAvgDepth: string | number; 
              compIdx: string; 
            }) => ({
              keyword: k.keyword,
              monthly_pc_qc_cnt: parseInt(k.monthlyPcQcCnt.toString()) || 0,
              monthly_mobile_qc_cnt: parseInt(k.monthlyMobileQcCnt.toString()) || 0,
              monthly_ave_pc_clk_cnt: parseInt(k.monthlyAvePcClkCnt.toString()) || 0,
              monthly_ave_mobile_clk_cnt: parseInt(k.monthlyAveMobileClkCnt.toString()) || 0,
              monthly_ave_pc_ctr: parseFloat(k.monthlyAvePcCtr.toString()) || 0,
              monthly_ave_mobile_ctr: parseFloat(k.monthlyAveMobileCtr.toString()) || 0,
              pl_avg_depth: parseInt(k.plAvgDepth.toString()) || 0,
              comp_idx: k.compIdx,
              blog_count: 0,
              cafe_count: 0,
              web_count: 0,
              news_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

          const { error: insertError } = await supabase
            .from('keywords')
            .insert(keywordObjects);

          if (insertError) {
            console.error('키워드 저장 오류:', insertError);
          } else {
            currentCount += uniqueNewKeywords.length;
            
            // 다음 시드키워드 설정 (사용되지 않은 키워드만)
            const availableKeywords = uniqueNewKeywords.filter(
              (keyword: string) => !usedSeedKeywords.has(keyword)
            );
            currentSeedKeywords = availableKeywords.slice(0, 3);
            
            // 사용된 시드키워드에 추가
            currentSeedKeywords.forEach(keyword => usedSeedKeywords.add(keyword));
          }
        } else {
          // 새로운 키워드가 없으면 다른 시드키워드 시도
          const allKeywords = Array.from(usedSeedKeywords);
          const remainingKeywords = allKeywords.filter(
            (keyword: string) => !currentSeedKeywords.includes(keyword) && !usedSeedKeywords.has(keyword)
          );
          
          if (remainingKeywords.length > 0) {
            currentSeedKeywords = remainingKeywords.slice(0, 3);
            currentSeedKeywords.forEach(keyword => usedSeedKeywords.add(keyword));
          } else {
            // 더 이상 수집할 키워드가 없음
            break;
          }
        }
      }

      // 세션 상태 업데이트 (테이블이 있는 경우에만)
      try {
        await supabase
          .from('auto_collect_sessions')
          // @ts-expect-error - auto_collect_sessions 테이블 타입이 아직 생성되지 않음
          .update({
            current_count: currentCount,
            seed_keywords: currentSeedKeywords,
            used_seed_keywords: Array.from(usedSeedKeywords),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (updateError) {
        // 테이블이 없는 경우 무시
        console.log('세션 상태 업데이트 건너뜀 (테이블 없음)');
      }

      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 자동 수집 완료 (테이블이 있는 경우에만)
    try {
      await supabase
        .from('auto_collect_sessions')
        // @ts-expect-error - auto_collect_sessions 테이블 타입이 아직 생성되지 않음
        .update({
          status: 'completed',
          current_count: currentCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (updateError) {
      // 테이블이 없는 경우 무시
      console.log('자동 수집 완료 상태 업데이트 건너뜀 (테이블 없음)');
    }

    console.log(`자동 수집 완료: ${currentCount}개 키워드 수집`);

  } catch (error) {
    console.error('백그라운드 자동 수집 오류:', error);
    
    // 오류 발생 시 세션 상태 업데이트 (테이블이 있는 경우에만)
    try {
      await supabase
        .from('auto_collect_sessions')
        // @ts-expect-error - auto_collect_sessions 테이블 타입이 아직 생성되지 않음
        .update({
          status: 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (updateError) {
      // 테이블이 없는 경우 무시
      console.log('오류 상태 업데이트 건너뜀 (테이블 없음)');
    }
  }
}
