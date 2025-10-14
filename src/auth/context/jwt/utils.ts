import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY, JWT_KEEP_SIGNED_IN_KEY } from './constant';

// ----------------------------------------------------------------------

/**
 * Clear all authentication tokens from storage
 */
export function clearAllTokens() {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_KEEP_SIGNED_IN_KEY);
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
    
    // Clear any pending expiry timeout
    if ((window as any).tokenExpiryTimeout) {
      clearTimeout((window as any).tokenExpiryTimeout);
      delete (window as any).tokenExpiryTimeout;
    }
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  // Clear any existing timeout to prevent multiple timers
  if ((window as any).tokenExpiryTimeout) {
    clearTimeout((window as any).tokenExpiryTimeout);
    delete (window as any).tokenExpiryTimeout;
  }

  // If token is already expired or will expire very soon (within 1 minute), don't set the timeout
  // The checkUserSession will handle cleanup on next page load
  if (timeLeft <= 60000) {
    return;
  }

  // Don't set timeout for very long durations (> 24 hours) as it's unreliable
  // Browser will handle session validation on next page load anyway
  if (timeLeft > 24 * 60 * 60 * 1000) {
    return;
  }
  
  (window as any).tokenExpiryTimeout = setTimeout(() => {
    try {
      const keepSignedIn = localStorage.getItem(JWT_KEEP_SIGNED_IN_KEY) === 'true';
      if (keepSignedIn) {
        localStorage.removeItem(JWT_STORAGE_KEY);
        localStorage.removeItem(JWT_KEEP_SIGNED_IN_KEY);
      } else {
        sessionStorage.removeItem(JWT_STORAGE_KEY);
      }
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null, keepSignedIn?: boolean) {
  try {
    if (accessToken) {
      // Clear any existing timeout
      if ((window as any).tokenExpiryTimeout) {
        clearTimeout((window as any).tokenExpiryTimeout);
        delete (window as any).tokenExpiryTimeout;
      }

      // Store token based on keepSignedIn preference
      if (keepSignedIn) {
        localStorage.setItem(JWT_STORAGE_KEY, accessToken);
        localStorage.setItem(JWT_KEEP_SIGNED_IN_KEY, 'true');
        sessionStorage.removeItem(JWT_STORAGE_KEY);
      } else {
        sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
        localStorage.removeItem(JWT_STORAGE_KEY);
        localStorage.removeItem(JWT_KEEP_SIGNED_IN_KEY);
      }

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      clearAllTokens();
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
