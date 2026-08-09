import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { ROLE_NAV } from './roleNav';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user ? ROLE_NAV[user.role] : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
