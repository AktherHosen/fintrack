import { create } from 'zustand';
import { toast as sonnerToast } from 'sonner';

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
  isCreateBannerOpen: boolean;
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
  setCreateBannerOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('fintrack_theme') as 'dark' | 'light';
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
};

const initialTheme = getInitialTheme();
if (typeof window !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme,
  locale:
    (typeof window !== 'undefined' && (localStorage.getItem('fintrack_locale') as 'en' | 'bn')) ||
    'en',
  currency: (typeof window !== 'undefined' && localStorage.getItem('fintrack_currency')) || 'BDT',
  isSidebarOpen: true,
  isMobileNavOpen: false,
  isAddTransactionOpen: false,
  isAddAccountOpen: false,
  isAddTransferOpen: false,
  isAddBudgetOpen: false,
  isAddLoanOpen: false,
  isCreateBannerOpen: false,
  toasts: [],

  setTheme: (theme) => {
    localStorage.setItem('fintrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
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
  setCreateBannerOpen: (open) => set({ isCreateBannerOpen: open }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // Trigger Sonner notification
    if (toast.type === 'success') {
      sonnerToast.success(toast.title, { description: toast.description });
    } else if (toast.type === 'error') {
      sonnerToast.error(toast.title, { description: toast.description });
    } else if (toast.type === 'warning') {
      sonnerToast.warning(toast.title, { description: toast.description });
    } else {
      sonnerToast.info(toast.title, { description: toast.description });
    }

    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

