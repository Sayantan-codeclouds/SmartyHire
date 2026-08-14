import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandPalette from '../ui/CommandPalette';

const DashboardLayout = ({ children }) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
