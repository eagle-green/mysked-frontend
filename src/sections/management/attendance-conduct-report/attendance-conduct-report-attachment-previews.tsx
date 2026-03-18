import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { pdfjs, Page as PdfPage, Document as PdfDocument } from 'react-pdf';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { openDocumentUrl, useDocumentBlobUrl, getDocumentDisplayUrl } from 'src/utils/document-url';

import { Iconify } from 'src/components/iconify';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ----------------------------------------------------------------------

/** PDF preview for attachment URL (first page only). Uses proxy URL for Supabase so signed URL expiry does not break. */
export function AttachmentPdfPreview({ url, index }: { url: string; index: number }) {
  const displayUrl = getDocumentDisplayUrl(url);
  const { blobUrl, loading, error } = useDocumentBlobUrl(displayUrl);

  const handleOpenInNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'noopener,noreferrer');
    else openDocumentUrl(displayUrl);
  };

  if (error) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
          Failed to load PDF
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => openDocumentUrl(displayUrl)}
          sx={{ mt: 0.5, textTransform: 'none', p: 0, minHeight: 0 }}
        >
          Attachment {index + 1} — Open in new tab
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Loading…
        </Typography>
      </Box>
    );
  }

  if (!blobUrl) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        minHeight: 200,
        bgcolor: 'background.neutral',
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
      onClick={handleOpenInNewTab}
      role="button"
    >
      <Box
        sx={{
          width: '100%',
          height: 300,
          overflow: 'hidden',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <PdfDocument
          file={blobUrl}
          loading={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <CircularProgress size={32} />
            </Box>
          }
          error={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 300,
                p: 2,
              }}
            >
              <Iconify icon="solar:file-text-bold" width={48} sx={{ color: 'error.main' }} />
              <Typography variant="caption" color="text.secondary">
                Attachment {index + 1}
              </Typography>
            </Box>
          }
        >
          <PdfPage
            pageNumber={1}
            width={300}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </PdfDocument>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Attachment {index + 1}
      </Typography>
    </Box>
  );
}

/** Image preview for attachment URL. Uses proxy URL for Supabase so signed URL expiry does not break. */
export function AttachmentImagePreview({ url, index }: { url: string; index: number }) {
  const displayUrl = getDocumentDisplayUrl(url);
  const { blobUrl, loading, error } = useDocumentBlobUrl(displayUrl);

  const handleOpenInNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'noopener,noreferrer');
    else openDocumentUrl(displayUrl);
  };

  if (error) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
          Failed to load image
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => openDocumentUrl(displayUrl)}
          sx={{ mt: 0.5, textTransform: 'none', p: 0, minHeight: 0 }}
        >
          Attachment {index + 1} — Open in new tab
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Loading…
        </Typography>
      </Box>
    );
  }

  if (!blobUrl) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        minHeight: 200,
        bgcolor: 'background.neutral',
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
      onClick={handleOpenInNewTab}
      role="button"
    >
      <Box
        component="img"
        src={blobUrl}
        alt={`Attachment ${index + 1}`}
        sx={{
          width: '100%',
          maxHeight: 280,
          objectFit: 'contain',
          borderRadius: 1,
          display: 'block',
        }}
      />
      <Typography variant="caption" color="text.secondary">
        Attachment {index + 1}
      </Typography>
    </Box>
  );
}

/** Same URL type detection as in tab (Unauthorized Driving / Verbal Warnings attachment section). */
export function isAttachmentImage(url: string): boolean {
  return (
    /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) ||
    /cloudinary\.com.*\.(jpe?g|png|gif|webp)/i.test(url) ||
    (url.includes('cloudinary.com') && (url.includes('/image/') || url.includes('/upload/')))
  );
}

export function isAttachmentPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url) || (url.includes('cloudinary.com') && url.includes('/raw/'));
}
