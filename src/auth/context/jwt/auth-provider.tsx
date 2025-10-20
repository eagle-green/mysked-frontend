import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { fetcher, endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';
import { isValidToken, clearAllTokens } from './utils';
import { JWT_STORAGE_KEY, JWT_KEEP_SIGNED_IN_KEY } from './constant';

import type { AuthState } from '../../types';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      // Check both localStorage (persistent) and sessionStorage (session-only)
      const keepSignedIn = localStorage.getItem(JWT_KEEP_SIGNED_IN_KEY) === 'true';
      const accessToken = keepSignedIn 
        ? localStorage.getItem(JWT_STORAGE_KEY)
        : sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        // Set authorization header
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        
        const response = await fetcher(endpoints.auth.me);
        const { user } = response.data;

        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        // Only clear if token exists but is invalid
        if (accessToken) {
          clearAllTokens();
        }
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error in checkUserSession:', error);
      // Only clear tokens on 401 (unauthorized) errors
      if ((error as any)?.response?.status === 401) {
        clearAllTokens();
      }
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
