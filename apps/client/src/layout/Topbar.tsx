import { useState } from 'react';
import { LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../auth/roleHome';
import { NotificationBell } from '../components/NotificationBell';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <div className="hidden items-center gap-1 lg:flex">
        <span className="text-lg font-bold text-blue-600">FORGE</span>
        <span className="text-xs text-slate-400">LMS</span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
            aria-label="Account menu"
          >
            {user ? user.email.slice(0, 2).toUpperCase() : <UserIcon size={16} />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                {user ? ROLE_LABELS[user.role] : ''}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
