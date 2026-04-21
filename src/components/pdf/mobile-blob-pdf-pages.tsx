import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Page, pdfjs, Document } from 'react-pdf';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify';

// Same worker setup as FLRA / TMP PDF carousels
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type MobileBlobPdfPagesProps = {
  fileUrl: string;
  /** Max height of the page scroll area (toolbar sits below). */
  scrollAreaMaxHeight?: number | string | Record<string, string | number>;
};

/**
 * Renders a blob/object URL PDF one page at a time with prev/next controls — same pattern as FLRA preview on mobile.
 */
export function MobileBlobPdfPages({
  fileUrl,
  scrollAreaMaxHeight = { xs: 'min(68vh, 720px)', md: 'min(72vh, 800px)' },
}: MobileBlobPdfPagesProps) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [pageWidth, setPageWidth] = useState(400);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // Leave room for card/parent padding + our horizontal padding so canvas edges aren’t clipped
      const horizontalGutter = w <= 768 ? 56 : 48;
      setPageWidth(Math.max(220, Math.min(w - horizontalGutter, 900)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageKey, setPageKey] = useState(0);
  /** In-viewer pinch zoom (1 = fit width); browser page zoom still works via viewport meta. */
  const [pinchScale, setPinchScale] = useState(1);
  const pinchScaleRef = useRef(1);
  pinchScaleRef.current = pinchScale;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageNumber(1);
    setPageKey((k) => k + 1);
    setNumPages(null);
  }, [fileUrl]);

  useEffect(() => {
    setPinchScale(1);
  }, [fileUrl, pageNumber]);

  /** Two-finger pinch on the scroll area zooms the PDF preview in place (mobile). */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isMobile) {
      return () => {};
    }

    const getDist = (tl: TouchList) =>
      tl.length < 2
        ? 0
        : Math.hypot(tl[0].clientX - tl[1].clientX, tl[0].clientY - tl[1].clientY);

    let gesture: { d0: number; s0: number } | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d0 = getDist(e.touches);
        if (d0 > 0) {
          gesture = { d0, s0: pinchScaleRef.current };
        }
      }
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && gesture) {
        e.preventDefault();
        const d = getDist(e.touches);
        if (d <= 0 || gesture.d0 <= 0) return;
        const next = gesture.s0 * (d / gesture.d0);
        setPinchScale(Math.min(2.75, Math.max(1, next)));
      }
    };

    const onEnd = () => {
      gesture = null;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [isMobile, fileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
  }, []);

  const goToPrev = () => {
    setPageNumber((p) => Math.max(1, p - 1));
    setPageKey((k) => k + 1);
  };

  const goToNext = () => {
    setPageNumber((p) => Math.min(p + 1, numPages || 1));
    setPageKey((k) => k + 1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: { xs: 2, sm: 1.5 },
          py: 0.5,
          maxHeight: scrollAreaMaxHeight,
          WebkitOverflowScrolling: 'touch',
          touchAction: 'manipulation',
        }}
      >
        <Document
          key={fileUrl}
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
                width: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading PDF…
              </Typography>
            </Box>
          }
        >
          <Box
            sx={{
              display: 'inline-block',
              maxWidth: '100%',
              lineHeight: 0,
              transformOrigin: 'top center',
              transform: isMobile ? `scale(${pinchScale})` : 'none',
              '& canvas': { maxWidth: '100%' },
            }}
          >
            <Page
              key={`page-${pageNumber}-${pageKey}`}
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Box>
        </Document>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 1, sm: 1 },
          flexWrap: 'nowrap',
          py: { xs: 2, sm: 1.5 },
          px: { xs: 1.5, sm: 1 },
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button
          variant="contained"
          size={isMobile ? 'large' : 'small'}
          disabled={pageNumber <= 1}
          onClick={goToPrev}
          aria-label="Previous page"
          {...(isMobile
            ? {
                sx: { minWidth: 48, minHeight: 48, px: 1.25 },
                children: <Iconify icon="eva:arrow-ios-back-fill" width={22} />,
              }
            : {
                startIcon: <Iconify icon="eva:arrow-ios-back-fill" />,
                children: 'Previous',
              })}
        />
        <Typography variant="body2" sx={{ flex: '1 1 auto', textAlign: 'center', minWidth: 0 }}>
          Page {pageNumber} of {numPages ?? '–'}
        </Typography>
        <Button
          variant="contained"
          size={isMobile ? 'large' : 'small'}
          disabled={!numPages || pageNumber >= numPages}
          onClick={goToNext}
          aria-label="Next page"
          {...(isMobile
            ? {
                sx: { minWidth: 48, minHeight: 48, px: 1.25 },
                children: <Iconify icon="eva:arrow-ios-forward-fill" width={22} />,
              }
            : {
                endIcon: <Iconify icon="eva:arrow-ios-forward-fill" />,
                children: 'Next',
              })}
        />
      </Box>
    </Box>
  );
}
