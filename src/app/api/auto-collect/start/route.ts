import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocumentCounts } from '@/lib/naver/documents';

export async function POST(request: NextRequest) {
  try {
    console.log('자동 수집 시작 API 호출됨');
    
    const body = await request.json();
    console.log('요청 본문:', { targetCount: body.targetCount, seedKeywords: body.seedKeywords });
    
    const { targetCount, seedKeywords, userId = 'anonymous' } = body;

    if (!targetCount || !seedKeywords || seedKeywords.length === 0) {
      console.log('유효성 검사 실패:', { targetCount, seedKeywords });
      return NextResponse.json(
        { success: false, error: '목표 키워드 수와 시드키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Supabase 클라이언트 생성 중...');
    const supabase = await createClient();
    console.log('Supabase 클라이언트 생성 완료');

    // 자동 수집 세션 생성
    console.log('자동 수집 세션 생성 시도 중...');
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
    
    console.log('세션 생성 결과:', { session, sessionError });

    if (sessionError) {
      console.error('자동 수집 세션 생성 오류:', sessionError);
      
      // auto_collect_sessions 테이블이 없는 경우 임시로 UUID 생성
      if (sessionError.code === '42P01' || sessionError.code === 'PGRST205') { // 테이블이 존재하지 않음
        console.log('테이블이 없음 - 임시 세션으로 처리');
        const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 백그라운드에서 자동 수집 시작 (비동기)
        console.log('백그라운드 자동 수집 시작:', tempSessionId);
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
      
      console.error('예상치 못한 세션 생성 오류:', sessionError);
      return NextResponse.json(
        { success: false, error: `자동 수집 세션 생성에 실패했습니다: ${sessionError.message}` },
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
      { success: false, error: `자동 수집 시작에 실패했습니다: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// 백그라운드 자동 수집 함수
async function startBackgroundCollection(sessionId: string, seedKeywords: string[], targetCount: number) {
  const supabase = await createClient();
  let currentSeedKeywords = [...seedKeywords];
  const usedSeedKeywords = new Set(seedKeywords); // 시드로 사용된 키워드만 추적
  const allCollectedKeywords = new Set(seedKeywords); // 수집된 모든 키워드 추적
  let currentCount = 0;
  let consecutiveFailures = 0; // 연속 실패 횟수 추적

  try {
    while (currentCount < targetCount) {
      // 사용되지 않은 시드키워드 선택
      const availableKeywords = Array.from(allCollectedKeywords).filter(
        (keyword: string) => !usedSeedKeywords.has(keyword)
      );
      
      if (availableKeywords.length === 0) {
        console.log('더 이상 사용할 수 있는 시드키워드가 없습니다.');
        break;
      }
      
      // 사용되지 않은 키워드 중에서 3개 선택
      currentSeedKeywords = availableKeywords.slice(0, 3);
      console.log(`새로운 시드키워드 선택: ${currentSeedKeywords.join(', ')} (사용 가능: ${availableKeywords.length}개)`);
      
      // 선택된 시드키워드를 사용된 키워드에 추가
      currentSeedKeywords.forEach(keyword => usedSeedKeywords.add(keyword));
      
      // 현재 시드키워드로 검색 (직접 네이버 API 호출)
      console.log(`시드키워드로 검색 중: ${currentSeedKeywords.join(', ')}`);
      
      // 네이버 API 직접 호출 (fetch 대신)
      const { searchKeywords } = await import('@/lib/naver/keywords');
      const newKeywords = await searchKeywords(currentSeedKeywords, true);

      if (newKeywords && newKeywords.length > 0) {
        const newKeywordNames = newKeywords.map((k: { keyword: string }) => k.keyword);
        
        // 중복 제거하여 새로운 키워드만 추가
        const uniqueNewKeywords = newKeywordNames.filter(
          (keyword: string) => !allCollectedKeywords.has(keyword)
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
            // @ts-expect-error - Supabase 타입 정의 문제로 임시 처리
            .insert(keywordObjects);

          if (insertError) {
            console.error('키워드 저장 오류:', insertError);
          } else {
            currentCount += uniqueNewKeywords.length;
            console.log(`새로운 키워드 ${uniqueNewKeywords.length}개 저장 완료. 총 수집: ${currentCount}개`);
            
            // 수집된 키워드를 allCollectedKeywords에 추가
            uniqueNewKeywords.forEach(keyword => allCollectedKeywords.add(keyword));
            
            // 새로 저장된 키워드에 대해 문서수 자동 조회
            console.log('문서수 자동 조회 시작...');
            for (const keywordObj of keywordObjects) {
              try {
                const docCounts = await getDocumentCounts(keywordObj.keyword);
                await supabase
                  .from('keywords')
                  // @ts-expect-error - Supabase 타입 정의 문제로 임시 처리
                  .update({
                    blog_count: docCounts.blogCount,
                    cafe_count: docCounts.cafeCount,
                    web_count: docCounts.webCount,
                    news_count: docCounts.newsCount,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('keyword', keywordObj.keyword);
                console.log(`"${keywordObj.keyword}" 문서수 업데이트 완료:`, docCounts);
              } catch (docError) {
                console.error(`"${keywordObj.keyword}" 문서수 조회 오류:`, docError);
              }
            }
            
            // 성공적으로 키워드를 수집했으므로 연속 실패 횟수 리셋
            consecutiveFailures = 0;
            console.log(`키워드 수집 성공! 다음 반복에서 새로운 시드키워드를 선택합니다.`);
          }
        } else {
          // 새로운 키워드가 없음
          consecutiveFailures++;
          console.log(`새로운 키워드가 없음. 연속 실패: ${consecutiveFailures}회`);
          
          // 연속으로 5번 실패하면 중단
          if (consecutiveFailures >= 5) {
            console.log('연속 5회 실패로 자동 수집을 중단합니다.');
            break;
          }
          
          console.log('다음 반복에서 다른 시드키워드를 시도합니다.');
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
      } catch {
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
    } catch {
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
    } catch {
      // 테이블이 없는 경우 무시
      console.log('오류 상태 업데이트 건너뜀 (테이블 없음)');
    }
  }
}
