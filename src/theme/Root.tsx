import React, { useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AuthContext, type AuthState } from '../context/AuthContext';
import { ProgressProvider } from '../context/ProgressContext';

const TOKEN_KEY = 'lexai_access_token';
const REFRESH_KEY = 'lexai_refresh_token';
const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Returns 'paid' | 'free-account' | null (null = invalid/expired). */
function decodeAuthState(token: string): 'paid' | 'free-account' | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) return null;
  return Boolean(payload.hasAccess) ? 'paid' : 'free-account';
}

/** Dev-only: ?dev_auth=anonymous|free|paid overrides auth state on localhost. */
function getDevOverride(): AuthState | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search).get('dev_auth');
  if (p === 'anonymous') return 'anonymous';
  if (p === 'free') return 'free-account';
  if (p === 'paid') return 'paid';
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = (siteConfig.customFields?.apiUrl as string) || '';
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [authState, setAuthState] = useState<AuthState>(
    isLocal ? (getDevOverride() ?? 'paid') : 'checking'
  );

  useEffect(() => {
    if (isLocal) return;

    // 1. Extract tokens from URL if present
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRt = params.get('rt');

    if (urlToken && urlRt) {
      sessionStorage.setItem(TOKEN_KEY, urlToken);
      localStorage.setItem(REFRESH_KEY, urlRt);

      params.delete('token');
      params.delete('rt');
      const cleanSearch = params.toString();
      const cleanUrl =
        window.location.pathname +
        (cleanSearch ? `?${cleanSearch}` : '') +
        window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
    }

    // 2. Check stored access token
    const accessToken = sessionStorage.getItem(TOKEN_KEY);
    if (accessToken) {
      const state = decodeAuthState(accessToken);
      if (state) {
        setAuthState(state);
        return;
      }
    }

    // 3. Try to refresh
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('refresh failed');
          return res.json();
        })
        .then((data) => {
          if (data.accessToken) {
            const state = decodeAuthState(data.accessToken);
            if (state) {
              sessionStorage.setItem(TOKEN_KEY, data.accessToken);
              localStorage.setItem(REFRESH_KEY, data.refreshToken);
              setAuthState(state);
              return;
            }
          }
          setAuthState('anonymous');
        })
        .catch(() => setAuthState('anonymous'));
      return;
    }

    // 4. No tokens — anonymous
    setAuthState('anonymous');
  }, [apiUrl, isLocal]);

  // Periodic token refresh
  useEffect(() => {
    if (authState === 'checking' || authState === 'anonymous') return;

    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return;
      try {
        const res = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.accessToken) {
          sessionStorage.setItem(TOKEN_KEY, data.accessToken);
          const state = decodeAuthState(data.accessToken);
          if (state) setAuthState(state);
        }
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
      } catch {
        // Silently fail — next interval will retry
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [authState, apiUrl]);

  return (
    <AuthContext.Provider value={{ authState }}>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthContext.Provider>
  );
}

export default function Root({ children }: { children: React.ReactNode }) {
  // AuthGate is SSR-safe: useState initializer guards `typeof window`, useEffect
  // doesn't run server-side, and SSR initial state is 'checking' which makes
  // <DocItemContent> render gated/anonymous-aware content during build. We must
  // NOT wrap this in <BrowserOnly>: that would skip SSR for every page, which
  // produced empty index.html files and broke @easyops-cn/docusaurus-search-local
  // (the indexer scrapes server-rendered HTML at build time).
  return <AuthGate>{children}</AuthGate>;
}
