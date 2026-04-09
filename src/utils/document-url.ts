import type { MouseEvent as ReactMouseEvent } from 'react';

import { useRef, useState, useEffect } from 'react';

import axiosInstance from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export const USER_DOCUMENT_PROXY_PREFIX = '/api/upload/user-document';
export const TMP_DOCUMENT_PROXY_PREFIX = '/api/upload/tmp-document';

/** Root-level PDF in user-documents bucket; open via openDocumentUrl so axios sends the JWT. */
export function userDocumentsManualProxyUrl(filename: string): string {
  return `${USER_DOCUMENT_PROXY_PREFIX}?path=${encodeURIComponent(filename)}`;
}

/**
 * Nav items that open authenticated proxy PDFs: intercept click on the same RouterLink as other
 * items (avoids native `<button>` UA padding/alignment vs `<a>`). Axios still sends JWT via openDocumentUrl.
 */
export function mergeNavItemDocumentOpen(
  documentOpenPath: string | undefined,
  baseProps: Record<string, unknown>,
  otherOnClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void
): {
  baseProps: Record<string, unknown>;
  /** When set, forward to ItemRoot (ButtonBase) for collapse toggles; document items attach click on the link in baseProps instead. */
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
} {
  const trimmed = documentOpenPath?.trim();
  if (!trimmed) {
    return { baseProps, onClick: otherOnClick };
  }

  const existing = baseProps.onClick as ((e: ReactMouseEvent<HTMLElement>) => void) | undefined;

  return {
    baseProps: {
      ...baseProps,
      onClick: (e: ReactMouseEvent<HTMLElement>) => {
        e.preventDefault();
        otherOnClick?.(e as ReactMouseEvent<HTMLButtonElement>);
        existing?.(e);
        openDocumentUrl(trimmed);
      },
    },
    onClick: undefined,
  };
}

export function isProxyDocumentUrl(url: string): boolean {
  return (
    url.startsWith(USER_DOCUMENT_PROXY_PREFIX) || url.startsWith(TMP_DOCUMENT_PROXY_PREFIX)
  );
}

/**
 * Convert Supabase signed URL (user-documents bucket) to proxy URL so it never expires.
 * Signed URLs expire (~1h) and cause 400 InvalidJWT; proxy uses backend auth and streams the file.
 */
export function getDocumentDisplayUrl(url: string): string {
  if (!url || isProxyDocumentUrl(url)) return url;
  if (url.includes('supabase.co/storage') && url.includes('/user-documents/')) {
    const start = url.indexOf('/user-documents/') + '/user-documents/'.length;
    const end = url.indexOf('?');
    const path = end >= 0 ? url.slice(start, end) : url.slice(start);
    if (path) return `${USER_DOCUMENT_PROXY_PREFIX}?path=${encodeURIComponent(path)}`;
  }
  return url;
}

/** Open document in new tab; uses blob URL (fetch when needed) so new tab gets blob: URL instead of long signed URLs. */
export function openDocumentUrl(url: string): void {
  if (isProxyDocumentUrl(url)) {
    axiosInstance
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const u = URL.createObjectURL(res.data);
        window.open(u, '_blank', 'noopener,noreferrer');
      })
      .catch(() => {
        toast.error('Failed to open document');
      });
  } else {
    // Fetch as blob so we open blob URL (same as Unauthorized Driving Details attachments)
    fetch(url, { mode: 'cors' })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Failed to fetch'))))
      .then((data) => {
        const u = URL.createObjectURL(data);
        window.open(u, '_blank', 'noopener,noreferrer');
      })
      .catch(() => {
        // Fallback: open original URL (e.g. if CORS blocks fetch)
        window.open(url, '_blank', 'noopener,noreferrer');
      });
  }
}

/** Fetch document as blob via axios (for proxy URLs) then download */
export function downloadDocumentUrl(url: string, filename: string): void {
  if (isProxyDocumentUrl(url)) {
    axiosInstance
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const u = URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = u;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(u);
      })
      .catch(() => {
        toast.error('Download failed');
      });
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/** Hook: for proxy URL fetches with auth and returns blob URL for display; otherwise returns url */
export function useDocumentBlobUrl(url: string | undefined): {
  blobUrl: string | null;
  loading: boolean;
  error: boolean;
} {
  const [state, setState] = useState<{
    blobUrl: string | null;
    loading: boolean;
    error: boolean;
  }>({ blobUrl: null, loading: false, error: false });

  useEffect(() => {
    if (!url) {
      setState({ blobUrl: null, loading: false, error: false });
      return undefined;
    }
    if (isProxyDocumentUrl(url)) {
      setState((s) => ({ ...s, loading: true, error: false }));
      let cancelled = false;
      axiosInstance
        .get(url, { responseType: 'blob' })
        .then((res) => {
          if (cancelled) return;
          const u = URL.createObjectURL(res.data);
          setState({ blobUrl: u, loading: false, error: false });
        })
        .catch(() => {
          if (!cancelled) setState({ blobUrl: null, loading: false, error: true });
        });
      return () => {
        cancelled = true;
      };
    }
    // Non-proxy (Cloudinary, Supabase, etc.): fetch as blob for display so we use blob URL
    setState((s) => ({ ...s, loading: true, error: false }));
    let cancelled = false;
    fetch(url, { mode: 'cors' })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Failed to fetch'))))
      .then((data) => {
        if (cancelled) return;
        const u = URL.createObjectURL(data);
        setState({ blobUrl: u, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ blobUrl: url, loading: false, error: false });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const blobUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = blobUrlRef.current;
    blobUrlRef.current = state.blobUrl;
    if (prev && prev !== state.blobUrl && prev.startsWith('blob:')) {
      URL.revokeObjectURL(prev);
    }
  }, [state.blobUrl]);

  useEffect(() => () => {
      const current = blobUrlRef.current;
      if (current && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      blobUrlRef.current = null;
    }, []);

  return state;
}
