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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500 selection:text-white">
      {/* Desktop ShadCN Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals & Toast notifications */}
      <AddTransactionModal />
      <AddTransferModal />
      <AddAccountModal />
      <ToastContainer />
    </div>
  );
}
