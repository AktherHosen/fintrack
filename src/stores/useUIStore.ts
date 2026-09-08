import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface UIState {
  theme: 'dark' | 'light';
  locale: 'en' | 'bn';
  currency: string;
  isSidebarOpen: boolean;
  isMobileNavOpen: boolean;
  isAddTransactionOpen: boolean;
  isAddAccountOpen: boolean;
  isAddTransferOpen: boolean;
  isAddBudgetOpen: boolean;
  isAddLoanOpen: boolean;
  toasts: ToastMessage[];

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLocale: (locale: 'en' | 'bn') => void;
  setCurrency: (currency: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setAddTransactionOpen: (open: boolean) => void;
  setAddAccountOpen: (open: boolean) => void;
  setAddTransferOpen: (open: boolean) => void;
  setAddBudgetOpen: (open: boolean) => void;
  setAddLoanOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: (typeof window !== 'undefined' && (localStorage.getItem('fintrack_theme') as 'dark' | 'light')) || 'dark',
  locale: (typeof window !== 'undefined' && (localStorage.getItem('fintrack_locale') as 'en' | 'bn')) || 'en',
  currency: (typeof window !== 'undefined' && localStorage.getItem('fintrack_currency')) || 'BDT',
  isSidebarOpen: true,
  isMobileNavOpen: false,
  isAddTransactionOpen: false,
  isAddAccountOpen: false,
  isAddTransferOpen: false,
  isAddBudgetOpen: false,
  isAddLoanOpen: false,
  toasts: [],

  setTheme: (theme) => {
    localStorage.setItem('fintrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setLocale: (locale) => {
    localStorage.setItem('fintrack_locale', locale);
    set({ locale });
  },

  setCurrency: (currency) => {
    localStorage.setItem('fintrack_currency', currency);
    set({ currency });
  },

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  setAddTransactionOpen: (open) => set({ isAddTransactionOpen: open }),
  setAddAccountOpen: (open) => set({ isAddAccountOpen: open }),
  setAddTransferOpen: (open) => set({ isAddTransferOpen: open }),
  setAddBudgetOpen: (open) => set({ isAddBudgetOpen: open }),
  setAddLoanOpen: (open) => set({ isAddLoanOpen: open }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
