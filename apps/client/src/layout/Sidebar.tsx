import { NavLink } from 'react-router-dom';
import type { NavItem } from './roleNav';

interface SidebarProps {
  items: NavItem[];
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ items, open, onNavigate }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-1 px-2">
          <span className="text-lg font-bold text-blue-600">FORGE</span>
          <span className="text-xs text-slate-400">LMS</span>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
