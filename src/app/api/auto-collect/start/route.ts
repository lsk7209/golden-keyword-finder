import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSession, updateSessionState } from '@/lib/auto-collect/session-manager';

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

    // 세션 ID 생성
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 세션 생성
    await createSession(sessionId, {
      status: 'running',
      target_count: targetCount,
      current_count: seedKeywords.length,
      current_seed_keywords: seedKeywords,
      used_seed_keywords: [],
      message: '자동 수집이 시작되었습니다.',
      logs: [`🚀 자동 수집 시작 - 목표: ${targetCount}개, 초기 시드키워드: ${seedKeywords.join(', ')}`],
    });
    
    // 백그라운드에서 자동 수집 시작 (비동기)
    console.log('백그라운드 자동 수집 시작:', sessionId);
    startAutoCollection(sessionId, seedKeywords, targetCount).catch(error => {
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

// 새로운 자동 수집 함수
async function startAutoCollection(sessionId: string, initialSeedKeywords: string[], targetCount: number) {
  const supabase = await createClient();
  
  // 상태 관리
  const allCollectedKeywords = new Set<string>(initialSeedKeywords);
  const usedAsSeedKeywords = new Set<string>();
  let currentCount = initialSeedKeywords.length;
  let iterationCount = 0;
  
  console.log(`🎯 자동 수집 시작 - 목표: ${targetCount}개, 초기 키워드: ${initialSeedKeywords.length}개`);

  try {
    while (currentCount < targetCount && iterationCount < 100) {
      iterationCount++;
      console.log(`\n🔄 반복 ${iterationCount}회 시작 - 현재 수집: ${currentCount}개`);
      
      // 사용 가능한 시드키워드 선택
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
          continue;
        }
      } catch (apiError) {
        console.error('❌ 네이버 API 오류:', apiError);
        continue;
      }
      
      console.log(`🔍 검색된 연관키워드: ${relatedKeywords.length}개`);
      
      // 새로운 키워드만 필터링
      const newKeywords = relatedKeywords.filter(
        keyword => !allCollectedKeywords.has(keyword.keyword)
      );

      if (newKeywords.length === 0) {
        console.log('⚠️ 새로운 키워드가 없습니다.');
        continue;
      }

      console.log(`✨ 새로운 키워드: ${newKeywords.length}개`);

      // 새로운 키워드를 데이터베이스에 저장
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

      const { error: insertError } = await supabase
        .from('keywords')
        .insert(keywordObjects);

      if (insertError) {
        console.error('키워드 저장 오류:', insertError);
        continue;
      }

      // 수집된 키워드를 allCollectedKeywords에 추가
      newKeywords.forEach(k => allCollectedKeywords.add(k.keyword));
      currentCount += newKeywords.length;
      
      console.log(`✅ ${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`);
      
      // 세션 상태 업데이트
      updateSessionState(sessionId, {
        current_count: currentCount,
        current_seed_keywords: selectedSeeds,
        used_seed_keywords: Array.from(usedAsSeedKeywords),
        message: `${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`,
        logs: [`✅ ${newKeywords.length}개 키워드 저장 완료! 총 수집: ${currentCount}개`],
      });
      
      // 3초 대기 (API 제한 고려)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`🎉 자동 수집 완료! 총 ${currentCount}개 키워드 수집 (목표: ${targetCount}개)`);
    
    // 완료 상태 업데이트
    updateSessionState(sessionId, {
      status: 'completed',
      current_count: currentCount,
      message: `자동 수집 완료! 총 ${currentCount}개 키워드 수집`,
      logs: [`🎉 자동 수집 완료! 총 ${currentCount}개 키워드 수집 (목표: ${targetCount}개)`],
    });

  } catch (error) {
    console.error('❌ 자동 수집 오류:', error);
    
    // 오류 상태 업데이트
    updateSessionState(sessionId, {
      status: 'error',
      message: `자동 수집 오류: ${error instanceof Error ? error.message : String(error)}`,
      logs: [`❌ 자동 수집 오류: ${error instanceof Error ? error.message : String(error)}`],
    });
  }
}
