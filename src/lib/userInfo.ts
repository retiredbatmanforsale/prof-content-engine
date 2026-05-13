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

/**
 * SHA-256 of the user's email (lowercased + trimmed). Gravatar accepts
 * both MD5 and SHA-256 hashes; we use SHA-256 because it's available via
 * the browser's native crypto.subtle (MD5 isn't).
 */
async function emailToSha256(email: string): Promise<string> {
  const cleaned = email.trim().toLowerCase();
  const buffer = new TextEncoder().encode(cleaned);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Resolve the best avatar URL for a user. Priority:
 *  1. user.image (from the JWT, if backend provides one)
 *  2. Gravatar (if the email has one registered)
 *  3. null — caller renders the initial fallback
 *
 * Uses `d=404` so missing Gravatars 404 instead of returning a "mystery
 * man" placeholder — that lets us cleanly fall back to the initial.
 *
 * Pre-loads via Image() so the UI never flashes a broken image — only
 * resolves with a URL we know loaded successfully.
 */
export async function resolveAvatarUrl(
  user: UserInfo | null,
  size = 64,
): Promise<string | null> {
  if (!user) return null;
  if (user.image) return user.image;
  if (!user.email || typeof window === 'undefined') return null;
  if (typeof crypto?.subtle?.digest !== 'function') return null;

  try {
    const hash = await emailToSha256(user.email);
    const url = `https://www.gravatar.com/avatar/${hash}?d=404&s=${size}`;

    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}
