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

import { CircularProgressLoader } from '../ui/spinner';

export function AppLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
        <CircularProgressLoader size="xl" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
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
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto overflow-x-hidden min-w-0 pb-24 md:pb-8 space-y-4 sm:space-y-5 print:overflow-visible print:p-0 print:m-0 print:max-w-none print:w-full">
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
