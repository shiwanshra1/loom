import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const CHANGE_PASSWORD_PATH = '/change-password';

export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Every admin-provisioned account (any role, not just Student) arrives with
  // a temp password and must change it before anything else is reachable —
  // guarded here rather than in role-gated route trees since it applies
  // regardless of role. Checked against the current path so the change-
  // password screen itself doesn't redirect into an infinite loop.
  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }

  return <Outlet />;
}
