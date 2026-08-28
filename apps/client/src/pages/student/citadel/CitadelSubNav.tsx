import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/student/citadel', label: 'Overview', end: true },
  { to: '/student/citadel/sprints', label: 'Sprint Cycles', end: false },
  { to: '/student/citadel/problem-statement', label: 'Problem Statement', end: false },
  { to: '/student/citadel/progress-report', label: 'Progress Report', end: false },
  { to: '/student/citadel/feedback', label: 'Feedback', end: false },
];

export function CitadelSubNav() {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}
