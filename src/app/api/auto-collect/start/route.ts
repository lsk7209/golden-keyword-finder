import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSessionState, getSessionState, createSession } from '@/lib/auto-collect/session-manager';

export const maxDuration = 300; // 5분으로 설정

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 새로운 자동 수집 시작 API 호출됨');
    
    const body = await request.json();
    console.log('요청 본문:', { targetCount: body.targetCount, seedKeywords: body.seedKeywords });
    
    const { targetCount, seedKeywords } = body;

    if (!targetCount || !seedKeywords || seedKeywords.length === 0) {
      console.log('유효성 검사 실패:', { targetCount, seedKeywords });
      return NextResponse.json(
        { success: false, error: '목표 키워드 수와 시드키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Supabase 클라이언트 생성 중...');
    await createClient();
    console.log('Supabase 클라이언트 생성 완료');

    // 세션 ID 생성
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 데이터베이스에 세션 생성
    await createSession(sessionId, {
      status: 'running',
      target_count: targetCount,
      current_count: seedKeywords.length,
      current_seed_keywords: seedKeywords,
      used_seed_keywords: seedKeywords,
      message: '자동 수집이 시작되었습니다.',
      logs: [`🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`],
    });
    
    // 백그라운드에서 자동 수집 시작 (비동기)
    console.log('백그라운드 자동 수집 시작:', sessionId);
    startNewAutoCollection(sessionId, seedKeywords, targetCount).catch(error => {
      console.error('백그라운드 자동 수집 오류:', error);
      updateSessionState(sessionId, {
        status: 'error',
        message: `자동 수집 오류: ${error.message}`,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId,
        message: '새로운 자동 수집이 백그라운드에서 시작되었습니다.',
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

// 새로운 자동 수집 함수
async function startNewAutoCollection(sessionId: string, initialSeedKeywords: string[], targetCount: number) {
  const supabase = await createClient();
  
  // 상태 관리
  const allCollectedKeywords = new Set<string>(initialSeedKeywords); // 수집된 모든 키워드
  const usedAsSeedKeywords = new Set<string>(initialSeedKeywords); // 시드로 사용된 키워드
  let currentCount = initialSeedKeywords.length; // 현재 수집된 키워드 수
  let iterationCount = 0; // 반복 횟수
  
  console.log(`🎯 자동 수집 시작 - 목표: ${targetCount}개, 초기 키워드: ${initialSeedKeywords.length}개`);

  try {
    while (currentCount < targetCount && iterationCount < 50) { // 최대 50회 반복
      iterationCount++;
      console.log(`\n🔄 반복 ${iterationCount}회 시작 - 현재 수집: ${currentCount}개`);
      
      // 세션 상태 업데이트
      const currentSessionState = await getSessionState(sessionId);
      await updateSessionState(sessionId, {
        status: 'running',
        current_count: currentCount,
        current_seed_keywords: Array.from(allCollectedKeywords).filter(k => !usedAsSeedKeywords.has(k)).slice(0, 3),
        used_seed_keywords: Array.from(usedAsSeedKeywords),
        message: `반복 ${iterationCount}회 진행 중 - 현재 수집: ${currentCount}개`,
        logs: [
          ...(currentSessionState?.logs || []),
          `🔄 반복 ${iterationCount}회 시작 - 현재 수집: ${currentCount}개`
        ].slice(-10), // 최근 10개 로그만 유지
      });
      
      // 사용되지 않은 키워드 중에서 시드키워드 선택
      const availableForSeed = Array.from(allCollectedKeywords).filter(
        keyword => !usedAsSeedKeywords.has(keyword)
      );
      
      console.log(`📋 사용 가능한 시드키워드: ${availableForSeed.length}개`);
      
      if (availableForSeed.length === 0) {
        console.log('❌ 더 이상 사용할 수 있는 시드키워드가 없습니다.');
        break;
      }
      
      // 시드키워드 선택 (최대 3개)
      const selectedSeeds = availableForSeed.slice(0, 3);
      console.log(`🌱 선택된 시드키워드: ${selectedSeeds.join(', ')}`);
      
      // 선택된 키워드를 사용된 키워드에 추가
      selectedSeeds.forEach(keyword => usedAsSeedKeywords.add(keyword));
      
      // 네이버 API로 연관키워드 검색
      console.log('🔍 네이버 API 호출 시작...');
      const { searchKeywords } = await import('@/lib/naver/keywords');
      
      let relatedKeywords;
      try {
        relatedKeywords = await searchKeywords(selectedSeeds, true);
        console.log('🔍 네이버 API 응답:', relatedKeywords?.length || 0, '개 키워드');
        
        if (!relatedKeywords || relatedKeywords.length === 0) {
          console.log('⚠️ 연관키워드 검색 결과가 없습니다.');
        const sessionStateForNoResults = await getSessionState(sessionId);
        await updateSessionState(sessionId, {
          message: `연관키워드 검색 결과 없음 - 시드키워드: ${selectedSeeds.join(', ')}`,
          logs: [
            ...(sessionStateForNoResults?.logs || []),
            `⚠️ 연관키워드 검색 결과 없음 - 시드키워드: ${selectedSeeds.join(', ')}`
          ].slice(-10),
        });
          continue;
        }
      } catch (apiError) {
        console.error('❌ 네이버 API 오류:', apiError);
        const sessionStateForError = await getSessionState(sessionId);
        await updateSessionState(sessionId, {
          message: `네이버 API 오류: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
          logs: [
            ...(sessionStateForError?.logs || []),
            `❌ 네이버 API 오류: ${apiError instanceof Error ? apiError.message : String(apiError)}`
          ].slice(-10),
        });
        continue;
      }
      
      console.log(`🔍 검색된 연관키워드: ${relatedKeywords.length}개`);
      
      // 새로운 키워드만 필터링
      const newKeywords = relatedKeywords.filter(
        keyword => !allCollectedKeywords.has(keyword.keyword)
      );
      
      console.log(`✨ 새로운 키워드: ${newKeywords.length}개`);
      
      if (newKeywords.length === 0) {
        console.log('⚠️ 새로운 키워드가 없습니다.');
        continue;
      }
      
      // 데이터베이스에 저장할 키워드 객체 생성
      const keywordObjects = newKeywords.map(k => ({
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

      // 데이터베이스에 저장
      const { error: insertError } = await supabase
        .from('keywords')
        // @ts-expect-error - Supabase 타입 정의 문제로 임시 처리
        .insert(keywordObjects);

      if (insertError) {
        console.error('❌ 키워드 저장 오류:', insertError);
        continue;
      }

      // 수집된 키워드를 allCollectedKeywords에 추가
      newKeywords.forEach(k => allCollectedKeywords.add(k.keyword));
      currentCount += newKeywords.length;
      
      console.log(`✅ ${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`);
      
      // 성공 로그 추가
      const sessionStateForLog = await getSessionState(sessionId);
      await updateSessionState(sessionId, {
        current_count: currentCount,
        message: `${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`,
        logs: [
          ...(sessionStateForLog?.logs || []),
          `✅ ${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`
        ].slice(-10),
      });
      
      // 문서수 자동 조회 (선택적)
      console.log('📄 문서수 자동 조회 시작...');
      const { getDocumentCounts } = await import('@/lib/naver/documents');
      
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
          console.log(`📄 "${keywordObj.keyword}" 문서수 업데이트 완료`);
        } catch (docError) {
          console.error(`❌ "${keywordObj.keyword}" 문서수 조회 오류:`, docError);
        }
      }
      
      // 3초 대기 (API 제한 고려)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`🎉 자동 수집 완료! 총 ${currentCount}개 키워드 수집 (목표: ${targetCount}개)`);
    console.log(`📊 사용된 시드키워드: ${usedAsSeedKeywords.size}개`);
    console.log(`📊 총 수집된 키워드: ${allCollectedKeywords.size}개`);
    
    // 완료 상태 업데이트
    const sessionStateForCompletion = await getSessionState(sessionId);
    await updateSessionState(sessionId, {
      status: 'completed',
      current_count: currentCount,
      message: `자동 수집 완료! 총 ${currentCount}개 키워드 수집`,
      logs: [
        ...(sessionStateForCompletion?.logs || []),
        `🎉 자동 수집 완료! 총 ${currentCount}개 키워드 수집 (목표: ${targetCount}개)`
      ].slice(-10),
    });

  } catch (error) {
    console.error('❌ 자동 수집 오류:', error);
    
    // 오류 상태 업데이트
    const sessionStateForFinalError = await getSessionState(sessionId);
    await updateSessionState(sessionId, {
      status: 'error',
      message: `자동 수집 오류: ${error instanceof Error ? error.message : String(error)}`,
      logs: [
        ...(sessionStateForFinalError?.logs || []),
        `❌ 자동 수집 오류: ${error instanceof Error ? error.message : String(error)}`
      ].slice(-10),
    });
  }
}
