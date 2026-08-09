import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '@forge-loom/shared-types';
import { useAuth } from './AuthContext';
import { ROLE_HOME_PATH } from './roleHome';

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <>{children}</>;
}
