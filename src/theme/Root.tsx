import React, {useEffect, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TOKEN_KEY = 'lexai_access_token';
const REFRESH_KEY = 'lexai_refresh_token';
const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) return false;
  return Boolean(payload.hasAccess);
}

function AuthGate({children}: {children: React.ReactNode}) {
  const {siteConfig} = useDocusaurusContext();
  const apiUrl = (siteConfig.customFields?.apiUrl as string) || '';
  const mainPlatformUrl = (siteConfig.customFields?.mainPlatformUrl as string) || '';

  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1. Extract tokens from URL if present
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRt = params.get('rt');

    if (urlToken && urlRt) {
      sessionStorage.setItem(TOKEN_KEY, urlToken);
      localStorage.setItem(REFRESH_KEY, urlRt);

      // Clean URL — remove token params
      params.delete('token');
      params.delete('rt');
      const cleanSearch = params.toString();
      const cleanUrl =
        window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
    }

    // 2. Check stored token
    const accessToken = sessionStorage.getItem(TOKEN_KEY);
    if (accessToken && isTokenValid(accessToken)) {
      setAuthed(true);
      setChecking(false);
      return;
    }

    // 3. Try to refresh
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken}),
      })
        .then((res) => {
          if (!res.ok) throw new Error('refresh failed');
          return res.json();
        })
        .then((data) => {
          if (data.accessToken && isTokenValid(data.accessToken)) {
            sessionStorage.setItem(TOKEN_KEY, data.accessToken);
            localStorage.setItem(REFRESH_KEY, data.refreshToken);
            setAuthed(true);
          } else {
            redirectToLogin();
          }
        })
        .catch(() => {
          redirectToLogin();
        })
        .finally(() => setChecking(false));
      return;
    }

    // 4. No tokens — redirect to login
    redirectToLogin();
    setChecking(false);

    function redirectToLogin() {
      const currentUrl = window.location.href;
      window.location.href = `${mainPlatformUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
  }, [apiUrl, mainPlatformUrl]);

  // Periodic refresh
  useEffect(() => {
    if (!authed) return;

    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return;

      try {
        const res = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({refreshToken}),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.accessToken) {
          sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
      } catch {
        // Silently fail — next interval will retry
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [authed, apiUrl]);

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          color: '#737373',
        }}>
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #e5e5e5',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'lexai-spin 0.6s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{margin: 0, fontSize: 14}}>Verifying access...</p>
          <style>{`@keyframes lexai-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!authed) {
    return null; // Will have redirected
  }

  return <>{children}</>;
}

export default function Root({children}: {children: React.ReactNode}) {
  return (
    <BrowserOnly fallback={<div />}>
      {() => <AuthGate>{children}</AuthGate>}
    </BrowserOnly>
  );
}
