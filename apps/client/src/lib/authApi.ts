import type { PublicUser, Role } from '@forge-loom/shared-types';
import { apiRequest, setAccessToken } from './apiClient';

interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<PublicUser> {
  const data = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function loginRequest(payload: LoginPayload): Promise<PublicUser> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: payload });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<void>('/api/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function fetchCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>('/api/auth/me');
  return data.user;
}
