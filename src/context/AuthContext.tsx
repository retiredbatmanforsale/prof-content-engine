import React, { createContext, useContext } from 'react';

/** Three tiers of access:
 *  checking     — tokens not yet validated (SSR / first render)
 *  anonymous    — no valid token
 *  free-account — valid token, hasAccess = false
 *  paid         — valid token, hasAccess = true
 */
export type AuthState = 'checking' | 'anonymous' | 'free-account' | 'paid';

interface AuthContextValue {
  authState: AuthState;
}

export const AuthContext = createContext<AuthContextValue>({ authState: 'checking' });

export function useAuthState(): AuthState {
  return useContext(AuthContext).authState;
}
