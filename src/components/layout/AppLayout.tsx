import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/toast-container';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { AddTransferModal } from '../modals/AddTransferModal';
import { AddAccountModal } from '../modals/AddAccountModal';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation & FAB */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <AddTransactionModal />
      <AddTransferModal />
      <AddAccountModal />
      <ToastContainer />
    </div>
  );
}
