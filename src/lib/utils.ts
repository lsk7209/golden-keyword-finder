import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCompetitionColor(compIdx: string): string {
  switch (compIdx) {
    case '낮음':
      return 'text-green-600 bg-green-100';
    case '중간':
      return 'text-yellow-600 bg-yellow-100';
    case '높음':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function calculateGoldenScore(searchVolume: number, docCount: number): number {
  if (docCount === 0) return 999.99;
  return Number((searchVolume / docCount).toFixed(2));
}

export function parseSearchKeywords(input: string): string[] {
  return input
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .slice(0, 5); // 최대 5개
}

export function validateSearchInput(input: string): { isValid: boolean; message?: string } {
  const keywords = parseSearchKeywords(input);
  
  if (keywords.length === 0) {
    return { isValid: false, message: '최소 1개의 키워드를 입력해주세요.' };
  }
  
  if (keywords.length > 5) {
    return { isValid: false, message: '최대 5개의 키워드만 입력할 수 있습니다.' };
  }
  
  for (const keyword of keywords) {
    if (keyword.length < 2) {
      return { isValid: false, message: '키워드는 최소 2글자 이상이어야 합니다.' };
    }
    if (keyword.length > 50) {
      return { isValid: false, message: '키워드는 최대 50글자까지 입력할 수 있습니다.' };
    }
  }
  
  return { isValid: true };
}
