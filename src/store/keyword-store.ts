import { create } from 'zustand';
import { Keyword, FilterOptions } from '@/types/keyword';

interface KeywordStore {
  // 상태
  keywords: Keyword[];
  selectedIds: string[];
  isLoading: boolean;
  filters: FilterOptions;
  searchResults: Keyword[];
  
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
  
  // 계산된 값
  get filteredKeywords(): Keyword[];
  get goldenKeywords(): Keyword[];
  get selectedKeywords(): Keyword[];
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  goldenScoreRange: [0, 1000],
  competitionLevels: ['낮음', '중간', '높음'],
  searchVolumeMin: 0,
  searchVolumeMax: 1000000,
  docCountMax: 1000000,
  dateRange: [new Date(2020, 0, 1), new Date()],
  tags: [],
};

export const useKeywordStore = create<KeywordStore>((set, get) => ({
  // 초기 상태
  keywords: [],
  selectedIds: [],
  isLoading: false,
  filters: defaultFilters,
  searchResults: [],
  
  // 액션
  setKeywords: (keywords) => set({ keywords }),
  
  addKeywords: (newKeywords) => set((state) => {
    const existingKeywords = new Map(state.keywords.map(k => [k.keyword, k]));
    const uniqueKeywords = newKeywords.filter(k => !existingKeywords.has(k.keyword));
    return { keywords: [...state.keywords, ...uniqueKeywords] };
  }),
  
  updateKeyword: (id, data) => set((state) => ({
    keywords: state.keywords.map(k => 
      k.id === id ? { ...k, ...data, updatedAt: new Date().toISOString() } : k
    ),
  })),
  
  deleteKeywords: (ids) => set((state) => ({
    keywords: state.keywords.filter(k => !ids.includes(k.id)),
    selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
  })),
  
  toggleSelection: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(selectedId => selectedId !== id)
      : [...state.selectedIds, id],
  })),
  
  selectAll: () => set((state) => ({
    selectedIds: state.filteredKeywords.map(k => k.id),
  })),
  
  clearSelection: () => set({ selectedIds: [] }),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  // 계산된 값
  get filteredKeywords() {
    const { keywords, filters } = get();
    
    return keywords.filter(keyword => {
      // 검색어 필터
      if (filters.searchTerm && !keyword.keyword.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // 황금점수 범위
      if (keyword.goldenScore < filters.goldenScoreRange[0] || keyword.goldenScore > filters.goldenScoreRange[1]) {
        return false;
      }
      
      // 경쟁도
      if (!filters.competitionLevels.includes(keyword.compIdx)) {
        return false;
      }
      
      // 검색량 범위
      if (keyword.totalSearchVolume < filters.searchVolumeMin || keyword.totalSearchVolume > filters.searchVolumeMax) {
        return false;
      }
      
      // 문서수 최대값
      if (keyword.totalDocCount > filters.docCountMax) {
        return false;
      }
      
      // 날짜 범위
      const createdAt = new Date(keyword.createdAt);
      if (createdAt < filters.dateRange[0] || createdAt > filters.dateRange[1]) {
        return false;
      }
      
      // 태그
      if (filters.tags.length > 0 && !filters.tags.some(tag => keyword.tags.includes(tag))) {
        return false;
      }
      
      return true;
    });
  },
  
  get goldenKeywords() {
    const { filteredKeywords } = get();
    return filteredKeywords.filter(k => k.goldenScore >= 50);
  },
  
  get selectedKeywords() {
    const { keywords, selectedIds } = get();
    return keywords.filter(k => selectedIds.includes(k.id));
  },
}));
