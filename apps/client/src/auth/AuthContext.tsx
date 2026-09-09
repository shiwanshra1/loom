import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PublicUser } from '@forge-loom/shared-types';
import { refreshAccessToken } from '../lib/apiClient';
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  changePasswordRequest,
  type LoginPayload,
  type RegisterPayload,
  type ChangePasswordPayload,
} from '../lib/authApi';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  login: (payload: LoginPayload) => Promise<PublicUser>;
  register: (payload: RegisterPayload) => Promise<PublicUser>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<PublicUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<PublicUser | null>(null);

  // On first load there's no access token yet (it lives in memory only) — use
  // the httpOnly refresh cookie, if any, to silently restore the session.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) setStatus('unauthenticated');
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(payload: LoginPayload): Promise<PublicUser> {
    const loggedInUser = await loginRequest(payload);
    setUser(loggedInUser);
    setStatus('authenticated');
    return loggedInUser;
  }

  async function register(payload: RegisterPayload): Promise<PublicUser> {
    const registeredUser = await registerRequest(payload);
    setUser(registeredUser);
    setStatus('authenticated');
    return registeredUser;
  }

  async function logout(): Promise<void> {
    await logoutRequest().catch(() => undefined);
    setUser(null);
    setStatus('unauthenticated');
  }

  // Updates `user.mustChangePassword` locally from the response rather than
  // re-fetching /me — RequireAuth's redirect gate reads this field directly,
  // so it needs to flip immediately once the change succeeds.
  async function changePassword(payload: ChangePasswordPayload): Promise<PublicUser> {
    const updatedUser = await changePasswordRequest(payload);
    setUser(updatedUser);
    return updatedUser;
  }

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
