'use client';

import { useState, useEffect } from 'react';
import { SearchSection } from '@/components/home/SearchSection';
import { KeywordTable } from '@/components/home/KeywordTable';
import { SearchOptions, NaverKeyword } from '@/types/keyword';
import { ApiResponse, SearchKeywordsResponse } from '@/types/api';
import { usePersistentBackgroundSave } from '@/hooks/usePersistentBackgroundSave';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<NaverKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 지속적 백그라운드 자동 저장 훅 사용
  const { saveProgress, saveNotification, startPersistentBackgroundSave, recoverPendingSaves } = usePersistentBackgroundSave();

  // 페이지 로드 시 미완료된 저장 작업 복구
  useEffect(() => {
    recoverPendingSaves();
  }, [recoverPendingSaves]);

  const handleSearch = async (options: SearchOptions) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/keywords/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedKeywords: options.seedKeywords,
          showDetail: options.showDetail,
        }),
      });

      const result: ApiResponse<SearchKeywordsResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '검색에 실패했습니다.');
      }

      if (result.data) {
        const naverKeywords: NaverKeyword[] = result.data.keywords.map(k => ({
          keyword: k.keyword,
          monthlyPcQcCnt: k.monthlyPcQcCnt.toString(),
          monthlyMobileQcCnt: k.monthlyMobileQcCnt.toString(),
          monthlyAvePcClkCnt: k.monthlyAvePcClkCnt.toString(),
          monthlyAveMobileClkCnt: k.monthlyAveMobileClkCnt.toString(),
          monthlyAvePcCtr: k.monthlyAvePcCtr.toString(),
          monthlyAveMobileCtr: k.monthlyAveMobileCtr.toString(),
          plAvgDepth: k.plAvgDepth.toString(),
          compIdx: k.compIdx,
        }));

        setSearchResults(naverKeywords);

        // 검색된 연관키워드를 지속적 백그라운드에서 자동으로 데이터베이스에 저장
        startPersistentBackgroundSave(naverKeywords);

        // 자동 문서수 조회 옵션이 켜져있으면
        if (options.autoFetchDocs) {
          for (const keyword of naverKeywords) {
            await handleFetchDocs(keyword.keyword);
          }
        }
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setError(error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (keyword: NaverKeyword) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/keywords/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyword),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '저장에 실패했습니다.');
      }

      console.log('키워드 저장 완료:', result.data);
    } catch (error) {
      console.error('저장 오류:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchDocs = async (keyword: string) => {
    setIsFetchingDocs(true);
    try {
      const response = await fetch('/api/documents/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '문서수 조회에 실패했습니다.');
      }

      console.log('문서수 조회 완료:', result.data);
    } catch (error) {
      console.error('문서수 조회 오류:', error);
      throw error;
    } finally {
      setIsFetchingDocs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 황금키워드 파인더
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            네이버 검색 데이터를 활용하여 검색량은 높지만 경쟁 문서수가 적은 
            <span className="font-semibold text-blue-600"> 황금키워드</span>를 발굴하세요
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="mb-8">
          <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 백그라운드 자동 저장 진행 상황 */}
        {saveProgress.isActive && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">지속적 백그라운드 자동 저장 중...</h3>
                  <p className="text-xs text-blue-600 mt-1">메뉴 이동, 페이지 새로고침, 브라우저 종료해도 저장이 계속됩니다</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-blue-700 mb-1">
                      <span>{saveProgress.current} / {saveProgress.total}</span>
                      <span>{Math.round((saveProgress.current / saveProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                      <span>성공: {saveProgress.completed}</span>
                      <span>실패: {saveProgress.failed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 저장 완료 알림 */}
        {saveNotification.show && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className={`border rounded-lg p-4 ${
              saveNotification.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : saveNotification.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className={`text-xl ${
                    saveNotification.type === 'success' 
                      ? 'text-green-400' 
                      : saveNotification.type === 'error'
                      ? 'text-red-400'
                      : 'text-blue-400'
                  }`}>
                    {saveNotification.type === 'success' ? '✅' : 
                     saveNotification.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    saveNotification.type === 'success' 
                      ? 'text-green-800' 
                      : saveNotification.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {saveNotification.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <KeywordTable
              keywords={searchResults}
              onSave={handleSave}
              onFetchDocs={handleFetchDocs}
              isSaving={isSaving}
              isFetchingDocs={isFetchingDocs}
              autoSaveProgress={saveProgress}
            />
          </div>
        )}

        {/* 사용법 안내 */}
        {searchResults.length === 0 && !isLoading && !error && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                🚀 시작하기
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">1. 키워드 검색</h3>
                  <p className="text-gray-600 text-sm">
                    관심 있는 시드 키워드를 입력하고 연관키워드를 찾아보세요
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">💾</div>
                  <h3 className="text-lg font-semibold mb-2">2. 자동 저장</h3>
                  <p className="text-gray-600 text-sm">
                    검색된 연관키워드가 지속적 백그라운드에서 자동으로 데이터베이스에 저장되고<br/>
                    <span className="text-blue-600 font-medium">메뉴 이동과 관계없이 카페, 블로그, 웹, 뉴스 문서수도 자동으로 수집됩니다</span>
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">💎</div>
                  <h3 className="text-lg font-semibold mb-2">3. 황금키워드 발견</h3>
                  <p className="text-gray-600 text-sm">
                    데이터 메뉴에서 황금점수가 높은 키워드를 찾아보세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}