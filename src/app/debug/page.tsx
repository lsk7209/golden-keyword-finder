'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSearch = async () => {
    setIsLoading(true);
    setResult('테스트 시작...\n');

    try {
      const response = await fetch('/api/keywords/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedKeywords: ['홍대갈만한곳'],
          showDetail: true,
        }),
      });

      const data = await response.json();
      setResult(prev => prev + `응답 상태: ${response.status}\n`);
      setResult(prev => prev + `응답 데이터: ${JSON.stringify(data, null, 2)}\n`);
    } catch (error) {
      setResult(prev => prev + `오류: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">디버그 페이지</h1>
      
      <div className="mb-6">
        <button
          onClick={testSearch}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '테스트 중...' : '키워드 검색 테스트'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">결과:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>
    </div>
  );
}
