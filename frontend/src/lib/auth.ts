import { atom } from 'jotai';
import { l4Api } from './api';
import type { UserPublic } from './types';

export interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
}

export const authAtom = atom<AuthState>({
  user: null,
  token: null,
  isLoading: true,
});

export async function register(username: string, email: string, password: string) {
  const response = await l4Api.register(username, email, password);
  const data = response.data;
  if (data.success && data.data) {
    const { token, user } = data.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return { user, token };
  }
  throw new Error((data as { error?: string }).error || 'Registration failed');
}

export async function login(email: string, password: string) {
  const response = await l4Api.login(email, password);
  const data = response.data;
  if (data.success && data.data) {
    const { token, user } = data.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return { user, token };
  }
  throw new Error((data as { error?: string }).error || 'Login failed');
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export async function getCurrentUser(): Promise<UserPublic | null> {
  try {
    const response = await l4Api.getCurrentUser();
    const data = response.data;
    if (data.success && data.data) {
      const user = data.data;
      if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
  } catch {
    // ignore
  }
  return null;
}
