import { NaverKeyword } from '@/types/keyword';

/**
 * 키워드 데이터를 CSV 형식으로 변환
 */
export function convertToCSV(keywords: NaverKeyword[]): string {
  if (keywords.length === 0) {
    return '';
  }

  // CSV 헤더 (한글)
  const headers = [
    '키워드',
    '총 검색수',
    'PC 검색수',
    '모바일 검색수',
    'PC 클릭수',
    '모바일 클릭수',
    'PC CTR',
    '모바일 CTR',
    '광고수',
    '경쟁도'
  ];

  // 데이터 행 생성
  const rows = keywords.map(keyword => [
    keyword.keyword,
    (keyword.monthlyPcQcCnt + keyword.monthlyMobileQcCnt).toString(),
    keyword.monthlyPcQcCnt.toString(),
    keyword.monthlyMobileQcCnt.toString(),
    keyword.monthlyAvePcClkCnt.toString(),
    keyword.monthlyAveMobileClkCnt.toString(),
    keyword.monthlyAvePcCtr.toString(),
    keyword.monthlyAveMobileCtr.toString(),
    keyword.plAvgDepth.toString(),
    keyword.compIdx
  ]);

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 다운로드 링크 생성
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // DOM에 추가하고 클릭 후 제거
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // URL 해제
  URL.revokeObjectURL(url);
}

/**
 * 현재 시간을 기반으로 파일명 생성
 */
export function generateFilename(prefix: string = '키워드'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${prefix}_${year}${month}${day}_${hours}${minutes}.csv`;
}
