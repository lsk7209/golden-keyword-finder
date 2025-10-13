'use client';

import { useState, useEffect } from 'react';
import { SearchSection } from '@/components/home/SearchSection';
import { KeywordTable } from '@/components/home/KeywordTable';
import { SearchOptions, NaverKeyword } from '@/types/keyword';
import { ApiResponse, SearchKeywordsResponse } from '@/types/api';
import { convertToCSV, downloadCSV, generateFilename } from '@/lib/csv-export';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<NaverKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [saveNotification, setSaveNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

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

        // 클라이언트에서 자동 저장 시작
        if (result.data.saveResult?.message) {
          setSaveNotification({
            show: true,
            message: `🔄 ${result.data.saveResult.message}`,
            type: 'info',
          });

          // 클라이언트에서 자동 저장
          handleClientSideSave(naverKeywords);
        }

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

  const handleClientSideSave = async (keywords: NaverKeyword[]) => {
    let savedCount = 0;
    let failedCount = 0;

    for (const keyword of keywords) {
      try {
        const response = await fetch('/api/keywords/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(keyword),
        });

        const result = await response.json();
        
        if (result.success) {
          savedCount++;
          console.log(`키워드 저장 성공: ${keyword.keyword}`);
        } else {
          failedCount++;
          console.error(`키워드 저장 실패: ${keyword.keyword}`, result.error);
        }
      } catch (error) {
        failedCount++;
        console.error(`키워드 저장 오류: ${keyword.keyword}`, error);
      }

      // 저장 간격
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 저장 완료 알림
    setSaveNotification({
      show: true,
      message: `✅ ${savedCount}개 키워드가 자동으로 데이터베이스에 저장되었습니다${failedCount > 0 ? ` (${failedCount}개 실패)` : ''}`,
      type: failedCount > 0 ? 'error' : 'success',
    });

    // 5초 후 알림 자동 숨김
    setTimeout(() => {
      setSaveNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleExportCSV = () => {
    if (searchResults.length === 0) {
      setSaveNotification({
        show: true,
        message: '내보낼 검색 결과가 없습니다.',
        type: 'error',
      });
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return;
    }

    try {
      const csvContent = convertToCSV(searchResults);
      const filename = generateFilename('연관키워드');
      downloadCSV(csvContent, filename);
      
      setSaveNotification({
        show: true,
        message: `📊 ${searchResults.length}개 키워드가 CSV 파일로 내보내졌습니다.`,
        type: 'success',
      });
      
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('CSV 내보내기 오류:', error);
      setSaveNotification({
        show: true,
        message: 'CSV 내보내기 중 오류가 발생했습니다.',
        type: 'error',
      });
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 3000);
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
              onExportCSV={handleExportCSV}
              isSaving={isSaving}
              isFetchingDocs={isFetchingDocs}
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
                    검색된 연관키워드가 서버에서 자동으로 데이터베이스에 저장되고<br/>
                    <span className="text-blue-600 font-medium">카페, 블로그, 웹, 뉴스 문서수도 자동으로 수집됩니다</span>
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