/**
 * Reads the current user identity from the JWT in sessionStorage.
 * Returns null if no valid token. Used by ProfileMenu and anywhere else
 * the docs site needs to display "who is signed in."
 */

const TOKEN_KEY = 'lexai_access_token';
const REFRESH_KEY = 'lexai_refresh_token';

export type UserInfo = {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'USER' | string;
  image?: string;
  hasAccess: boolean;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getCurrentUser(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const p = decodeJwtPayload(token);
  if (!p) return null;
  const exp = p.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) return null;
  return {
    email: (p.email as string) ?? undefined,
    name: (p.name as string) ?? undefined,
    role: (p.role as string) ?? undefined,
    image: (p.image as string) ?? undefined,
    hasAccess: Boolean(p.hasAccess),
  };
}

export function signOut(redirectUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore quota / private mode */
  }
  window.location.href = redirectUrl;
}

export function userInitial(user: UserInfo | null): string {
  if (!user) return 'U';
  if (user.name) return user.name.trim().charAt(0).toUpperCase();
  if (user.email) return user.email.trim().charAt(0).toUpperCase();
  return 'U';
}
