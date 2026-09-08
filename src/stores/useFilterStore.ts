import { create } from 'zustand';
import { TransactionType } from '../types/database';

interface FilterState {
  searchQuery: string;
  selectedAccountId: string; // 'ALL' or uuid
  selectedCategoryId: string; // 'ALL' or uuid
  selectedType: TransactionType | 'ALL';
  startDate: string | null;
  endDate: string | null;

  setSearchQuery: (query: string) => void;
  setSelectedAccountId: (id: string) => void;
  setSelectedCategoryId: (id: string) => void;
  setSelectedType: (type: TransactionType | 'ALL') => void;
  setDateRange: (start: string | null, end: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  selectedAccountId: 'ALL',
  selectedCategoryId: 'ALL',
  selectedType: 'ALL',
  startDate: null,
  endDate: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
  setSelectedType: (selectedType) => set({ selectedType }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedAccountId: 'ALL',
      selectedCategoryId: 'ALL',
      selectedType: 'ALL',
      startDate: null,
      endDate: null,
    }),
}));
