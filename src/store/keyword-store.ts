import { create } from 'zustand';
import { Keyword, FilterOptions } from '@/types/keyword';

interface KeywordStore {
  // 상태
  keywords: Keyword[];
  selectedIds: string[];
  isLoading: boolean;
  filters: FilterOptions;
  searchResults: Keyword[];
  filteredKeywords: Keyword[]; // 캐시된 필터링 결과
  
  // 액션
  setKeywords: (keywords: Keyword[]) => void;
  addKeywords: (keywords: Keyword[]) => void;
  updateKeyword: (id: string, data: Partial<Keyword>) => void;
  deleteKeywords: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setLoading: (loading: boolean) => void;
  setSearchResults: (results: Keyword[]) => void;
  updateFilteredKeywords: () => void; // 필터링 결과 업데이트
  
  // 계산된 값
  get goldenKeywords(): Keyword[];
  get selectedKeywords(): Keyword[];
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  goldenScoreRange: [0, 999999999], // 매우 넓은 범위로 설정
  competitionLevels: ['낮음', '중간', '높음'],
  searchVolumeMin: 0,
  searchVolumeMax: 999999999, // 매우 넓은 범위로 설정
  docCountMax: 999999999, // 매우 넓은 범위로 설정
  // 문서수 범위 필터 - 매우 넓은 범위로 설정
  cafeCountMin: 0,
  cafeCountMax: 999999999,
  blogCountMin: 0,
  blogCountMax: 999999999,
  webCountMin: 0,
  webCountMax: 999999999,
  newsCountMin: 0,
  newsCountMax: 999999999,
  dateRange: [new Date(2020, 0, 1), new Date()],
  tags: [],
};

// 최적화된 필터링 함수
const filterKeywords = (keywords: Keyword[], filters: FilterOptions): Keyword[] => {
  return keywords.filter(keyword => {
    // 검색어 필터
    if (filters.searchTerm && !keyword.keyword.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // 황금점수 범위 (null/undefined 처리)
    const goldenScore = keyword.goldenScore ?? 0;
    if (goldenScore < filters.goldenScoreRange[0] || goldenScore > filters.goldenScoreRange[1]) {
      return false;
    }
    
    // 경쟁도 (null/undefined 처리)
    const compIdx = keyword.compIdx ?? '중간';
    if (!filters.competitionLevels.includes(compIdx)) {
      return false;
    }
    
    // 검색량 범위 (null/undefined 처리)
    const totalSearchVolume = keyword.totalSearchVolume ?? 0;
    if (totalSearchVolume < filters.searchVolumeMin || totalSearchVolume > filters.searchVolumeMax) {
      return false;
    }
    
    // 문서수 최대값 (null/undefined 처리)
    const totalDocCount = keyword.totalDocCount ?? 0;
    if (totalDocCount > filters.docCountMax) {
      return false;
    }
    
    // 카페 문서수 범위
    const cafeCount = keyword.cafeCount ?? 0;
    if (cafeCount < filters.cafeCountMin || cafeCount > filters.cafeCountMax) {
      return false;
    }
    
    // 블로그 문서수 범위
    const blogCount = keyword.blogCount ?? 0;
    if (blogCount < filters.blogCountMin || blogCount > filters.blogCountMax) {
      return false;
    }
    
    // 웹 문서수 범위
    const webCount = keyword.webCount ?? 0;
    if (webCount < filters.webCountMin || webCount > filters.webCountMax) {
      return false;
    }
    
    // 뉴스 문서수 범위
    const newsCount = keyword.newsCount ?? 0;
    if (newsCount < filters.newsCountMin || newsCount > filters.newsCountMax) {
      return false;
    }
    
    // 날짜 범위
    const createdAt = new Date(keyword.createdAt);
    if (createdAt < filters.dateRange[0] || createdAt > filters.dateRange[1]) {
      return false;
    }
    
    // 태그 (null/undefined 처리)
    const tags = keyword.tags ?? [];
    if (filters.tags.length > 0 && !filters.tags.some(tag => tags.includes(tag))) {
      return false;
    }
    
    return true;
  });
};

export const useKeywordStore = create<KeywordStore>()((set, get) => ({
    // 초기 상태
    keywords: [],
    selectedIds: [],
    isLoading: false,
    filters: defaultFilters,
    searchResults: [],
    filteredKeywords: [],
  
    // 액션
    setKeywords: (keywords) => set((state) => {
      const filteredKeywords = filterKeywords(keywords, state.filters);
      return { keywords, filteredKeywords };
    }),
    
    addKeywords: (newKeywords) => set((state) => {
      const existingKeywords = new Map(state.keywords.map(k => [k.keyword, k]));
      const uniqueKeywords = newKeywords.filter(k => !existingKeywords.has(k.keyword));
      const updatedKeywords = [...state.keywords, ...uniqueKeywords];
      const filteredKeywords = filterKeywords(updatedKeywords, state.filters);
      return { keywords: updatedKeywords, filteredKeywords };
    }),
    
    updateKeyword: (id, data) => set((state) => {
      const updatedKeywords = state.keywords.map(k => 
        k.id === id ? { ...k, ...data, updatedAt: new Date().toISOString() } : k
      );
      const filteredKeywords = filterKeywords(updatedKeywords, state.filters);
      return { keywords: updatedKeywords, filteredKeywords };
    }),
    
    deleteKeywords: (ids) => set((state) => {
      const updatedKeywords = state.keywords.filter(k => !ids.includes(k.id));
      const filteredKeywords = filterKeywords(updatedKeywords, state.filters);
      return { 
        keywords: updatedKeywords, 
        filteredKeywords,
        selectedIds: state.selectedIds.filter(id => !ids.includes(id))
      };
    }),
    
    toggleSelection: (id) => set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(selectedId => selectedId !== id)
        : [...state.selectedIds, id],
    })),
    
    selectAll: () => set((state) => ({
      selectedIds: state.filteredKeywords.map(k => k.id),
    })),
    
    clearSelection: () => set({ selectedIds: [] }),
    
    setFilters: (newFilters) => set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      const filteredKeywords = filterKeywords(state.keywords, updatedFilters);
      return { filters: updatedFilters, filteredKeywords };
    }),
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    setSearchResults: (results) => set({ searchResults: results }),
    
    updateFilteredKeywords: () => set((state) => {
      const filteredKeywords = filterKeywords(state.keywords, state.filters);
      return { filteredKeywords };
    }),
  
    // 계산된 값
    get goldenKeywords() {
      const { filteredKeywords } = get();
      return filteredKeywords.filter(k => (k.goldenScore ?? 0) >= 50);
    },
    
    get selectedKeywords() {
      const { keywords, selectedIds } = get();
      return keywords.filter(k => selectedIds.includes(k.id));
    },
  }));
