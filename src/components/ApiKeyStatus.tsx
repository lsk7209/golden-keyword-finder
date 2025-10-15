'use client';

import { useState, useEffect } from 'react';

interface ApiKeyStatus {
  name: string;
  requestCount: number;
  errorCount: number;
  errorRate: string;
  lastUsed: string;
  isAvailable: boolean;
}

interface ApiKeyPoolStatus {
  searchAdKeys: {
    total: number;
    available: number;
    status: ApiKeyStatus[];
  };
  openApiKeys: {
    total: number;
    available: number;
    status: ApiKeyStatus[];
  };
}

export function ApiKeyStatus() {
  const [status, setStatus] = useState<ApiKeyPoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/keywords/api-key-status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.error || '상태를 가져올 수 없습니다.');
      }
    } catch (err) {
      setError('API 키 상태를 확인할 수 없습니다.');
      console.error('API 키 상태 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 30초마다 상태 업데이트
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">API 키 상태 확인 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-red-800">❌ {error}</span>
          <button 
            onClick={fetchStatus}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-800 font-semibold">🔑 API 키 상태</h3>
        <button 
          onClick={fetchStatus}
          className="text-green-600 hover:text-green-800 underline text-sm"
        >
          새로고침
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 검색광고 API */}
        <div className="bg-white rounded-lg p-3 border">
          <h4 className="font-medium text-gray-800 mb-2">
            🔍 검색광고 API ({status.searchAdKeys.available}/{status.searchAdKeys.total})
          </h4>
          <div className="space-y-1">
            {status.searchAdKeys.status.map((key, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className={`font-medium ${key.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {key.name}
                </span>
                <span className="text-gray-500">
                  {key.requestCount}회 ({key.errorRate})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 오픈 API */}
        <div className="bg-white rounded-lg p-3 border">
          <h4 className="font-medium text-gray-800 mb-2">
            📄 오픈 API ({status.openApiKeys.available}/{status.openApiKeys.total})
          </h4>
          <div className="space-y-1">
            {status.openApiKeys.status.map((key, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className={`font-medium ${key.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {key.name}
                </span>
                <span className="text-gray-500">
                  {key.requestCount}회 ({key.errorRate})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
