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
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-indigo-500 selection:text-white">
      {/* Desktop ShadCN Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8 max-w-6xl w-full mx-auto space-y-6">
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
