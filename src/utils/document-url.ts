import { useRef, useState, useEffect } from 'react';

import axiosInstance from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export const USER_DOCUMENT_PROXY_PREFIX = '/api/upload/user-document';
export const TMP_DOCUMENT_PROXY_PREFIX = '/api/upload/tmp-document';

export function isProxyDocumentUrl(url: string): boolean {
  return (
    url.startsWith(USER_DOCUMENT_PROXY_PREFIX) || url.startsWith(TMP_DOCUMENT_PROXY_PREFIX)
  );
}

/** Open document in new tab; fetches via auth when URL is backend proxy */
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
    window.open(url, '_blank');
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
    if (!isProxyDocumentUrl(url)) {
      setState({ blobUrl: url, loading: false, error: false });
      return undefined;
    }
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
  }, [url]);

  const blobUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = blobUrlRef.current;
    blobUrlRef.current = state.blobUrl;
    if (prev && prev !== state.blobUrl) {
      URL.revokeObjectURL(prev);
    }
  }, [state.blobUrl]);

  useEffect(() => () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    }, []);

  return state;
}
