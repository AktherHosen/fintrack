import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/toast-container';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { AddTransferModal } from '../modals/AddTransferModal';
import { AddAccountModal } from '../modals/AddAccountModal';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#060911] flex justify-center selection:bg-emerald-500 selection:text-white">
      {/* Mobile-First App Shell */}
      <div className="flutter-mobile-shell w-full max-w-md sm:max-w-lg border-x border-slate-900/60 pb-24 shadow-2xl flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 py-4 w-full">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      {/* Global Bottom Sheet Modals */}
      <AddTransactionModal />
      <AddTransferModal />
      <AddAccountModal />
      <ToastContainer />
    </div>
  );
}
