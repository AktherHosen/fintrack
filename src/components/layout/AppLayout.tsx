import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';
import { Toaster } from '../ui/sonner';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { AddTransferModal } from '../modals/AddTransferModal';
import { AddAccountModal } from '../modals/AddAccountModal';
import { CreateBannerModal } from '../modals/CreateBannerModal';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">Loading FinTrack...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500 selection:text-white print:h-auto print:overflow-visible print:bg-white print:text-zinc-950">
      {/* Desktop ShadCN Sidebar */}
      <div className="print:hidden hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden min-w-0 print:h-auto print:overflow-visible print:w-full print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8 max-w-6xl w-full mx-auto space-y-6 print:overflow-visible print:p-0 print:m-0 print:max-w-none print:w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Slide-over Drawer */}
      <div className="print:hidden">
        <MobileDrawer />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden" data-mobile-nav>
        <MobileNav />
      </div>

      {/* Modals & Sonner notifications */}
      <div className="print:hidden">
        <AddTransactionModal />
        <AddTransferModal />
        <AddAccountModal />
        <CreateBannerModal />
        <Toaster />
      </div>
    </div>
  );
}
