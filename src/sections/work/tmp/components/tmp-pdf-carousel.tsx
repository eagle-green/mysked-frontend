import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { useState, useEffect } from 'react';
import { Page, pdfjs, Document } from 'react-pdf';

import {
  Box,
  Card,
  Chip,
  Stack,
  Avatar,
  Button,
  Skeleton,
  Typography,
  IconButton,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { fDate, fTime } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';
import { openDocumentUrl, useDocumentBlobUrl } from 'src/utils/document-url';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ----------------------------------------------------------------------

type Worker = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string;
  position: string;
  confirmed: boolean; // Overall status (all PDFs confirmed)
  confirmed_count?: number; // How many PDFs confirmed
  total_pdfs?: number; // Total PDFs in the TMP
  pdf_confirmations?: Record<string, boolean>; // Per-PDF confirmation status
  confirmed_at?: string;
  confirmation_note?: string;
};

type TmpPdf = {
  id: string;
  pdf_url: string;
  pdf_filename: string;
  notes?: string;
  created_at: string;
  uploaded_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  worker_confirmed?: boolean; // Worker's confirmation status for this specific PDF
};

type Props = {
  pdfs: TmpPdf[];
  workers?: Worker[];
  timesheetManagerId?: string;
  initialIndex?: number; // Start at specific index (e.g., last PDF after upload)
  onAddNewPdf?: () => void;
  onConfirmTmp?: (pdfId: string) => void; // Worker confirms they've read THIS PDF
  onDeletePdf?: (pdfId: string) => void;
  canEdit?: boolean;
  embedded?: boolean;
  hideWorkerCount?: boolean;
  hideWorkers?: boolean;
  hideAddedBy?: boolean;
};

export function TmpPdfCarousel({ 
  pdfs, 
  workers = [], 
  timesheetManagerId,
  initialIndex = 0,
  onAddNewPdf, 
  onConfirmTmp, 
  onDeletePdf,
  canEdit = false, 
  embedded = false, 
  hideWorkerCount = false, 
  hideWorkers = false, 
  hideAddedBy = false,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentPdf = pdfs[currentIndex];
  const { blobUrl: currentPdfBlobUrl, loading: blobLoading, error: blobError } = useDocumentBlobUrl(currentPdf?.pdf_url);

  // Update index when pdfs array changes (e.g., after upload, show last PDF)
  useEffect(() => {
    if (pdfs.length > 0 && initialIndex !== undefined) {
      const targetIndex = Math.min(initialIndex, pdfs.length - 1);
      setCurrentIndex(targetIndex);
    }
  }, [pdfs.length, initialIndex]);

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : pdfs.length - 1;
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < pdfs.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
  };

  if (!pdfs || pdfs.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Iconify icon="solar:file-bold-duotone" width={64} sx={{ mb: 2, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No TMPs Uploaded
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {canEdit ? 'Click "Add TMP" button above to upload a PDF' : 'No TMPs have been uploaded for this job yet'}
        </Typography>
      </Box>
    );
  }

  const confirmedWorkers = workers?.filter((w) => w.confirmed) || [];

  return (
    <Box>
      {!embedded && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Traffic Management Plans
              </Typography>
              <Chip label={`${pdfs.length} PDF${pdfs.length > 1 ? 's' : ''}`} size="small" />
            </Box>
            {!hideWorkerCount && workers && workers.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Workers ({confirmedWorkers.length}/{workers.length} confirmed)
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <CardContent>
        <Stack spacing={3}>
          {/* Current PDF */}
          <Card variant="outlined">
            {/* PDF Preview - OUTSIDE CardContent, displayed first */}
            {currentPdf?.pdf_url ? (
              <Box
                sx={{
                  width: '100%',
                  bgcolor: 'background.neutral',
                  cursor: 'pointer',
                  '& .react-pdf__Page': {
                    maxWidth: '100%',
                  },
                  '& .react-pdf__Page__canvas': {
                    width: '100% !important',
                    height: 'auto !important',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openDocumentUrl(currentPdf.pdf_url);
                }}
              >
                {blobLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, width: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : blobError || !currentPdfBlobUrl ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, width: '100%', gap: 1 }}>
                    <Iconify icon="solar:file-corrupted-bold-duotone" sx={{ fontSize: 60, color: 'error.main' }} />
                    <Typography variant="body2" color="error">Failed to load PDF</Typography>
                  </Box>
                ) : (
                  <Document
                    key={`${currentIndex}-${currentPdf.id}-${currentPdfBlobUrl}`}
                    file={currentPdfBlobUrl}
                    loading={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, width: '100%' }}>
                        <CircularProgress />
                      </Box>
                    }
                    error={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, width: '100%', gap: 1 }}>
                        <Iconify icon="solar:file-corrupted-bold-duotone" sx={{ fontSize: 60, color: 'error.main' }} />
                        <Typography variant="body2" color="error">Failed to load PDF</Typography>
                      </Box>
                    }
                  >
                    <Page
                      pageNumber={1}
                      width={Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1200, 1200)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <Skeleton variant="rectangular" width="100%" height={776} sx={{ borderRadius: 1 }} />
                      }
                    />
                  </Document>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '400px',
                  bgcolor: 'grey.100',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <Iconify icon="solar:file-text-bold" sx={{ fontSize: 80, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">
                  No PDF Uploaded
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Upload a PDF to get started
                </Typography>
              </Box>
            )}

            {/* Navigation and Count - Between PDF and content */}
            {pdfs.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 2,
                py: 2,
                bgcolor: 'background.neutral',
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}>
                <IconButton onClick={handlePrevious} size="small">
                  <Iconify icon="carbon:chevron-left" />
                </IconButton>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  {currentIndex + 1} of {pdfs.length}
                </Typography>
                <IconButton onClick={handleNext} size="small">
                  <Iconify icon="carbon:chevron-right" />
                </IconButton>
              </Box>
            )}

            {/* Card Content - Details below PDF */}
            <CardContent>
              <Stack spacing={1.5}>
                {/* Header with TMP # and Added By */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      TMP #{currentIndex + 1}
                    </Typography>
                    {canEdit && onDeletePdf && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePdf(currentPdf.id);
                        }}
                        sx={{
                          '&:hover': {
                            bgcolor: 'error.lighter',
                          },
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    )}
                  </Box>
                  {!hideAddedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded By:
                      </Typography>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                        {currentPdf.uploaded_by.first_name?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {currentPdf.uploaded_by.first_name} {currentPdf.uploaded_by.last_name} • {fDate(currentPdf.created_at)} at {fTime(currentPdf.created_at)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* TMP File Title */}
                {currentPdf.pdf_filename && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {currentPdf.pdf_filename}
                    </Typography>
                  </Box>
                )}

                {/* Notes */}
                {currentPdf.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {currentPdf.notes}
                    </Typography>
                  </Box>
                )}

                {/* Workers List (For Admin) */}
                {!hideWorkers && workers && workers.length > 0 && (
                  <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      {hideWorkerCount ? 'Workers' : `Workers (${workers.filter(w => w.confirmed).length}/${workers.length} confirmed)`}
                    </Typography>
                    <Stack spacing={1}>
                      {workers.map((worker) => {
                        const isTimesheetManager = worker.id === timesheetManagerId;
                        const positionLabel = JOB_POSITION_OPTIONS.find(
                          (option) => option.value === worker.position
                        )?.label || worker.position?.toUpperCase();
                        
                        // Check if this worker confirmed THIS specific PDF
                        const confirmedThisPdf = worker.pdf_confirmations?.[currentPdf.id] || false;
                        
                        return (
                          <Box
                            key={worker.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={worker.photo_url}
                                sx={{ width: 32, height: 32 }}
                              >
                                {worker.first_name?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight="medium">
                                {worker.first_name} {worker.last_name}
                              </Typography>
                              <Label
                                variant="soft"
                                color={getPositionColor(worker.position)}
                                sx={{ fontSize: '0.65rem', height: 18 }}
                              >
                                {positionLabel}
                              </Label>
                              {isTimesheetManager && (
                                <Label
                                  variant="soft"
                                  color="info"
                                  sx={{ fontSize: '0.65rem', height: 18 }}
                                >
                                  Timesheet Manager
                                </Label>
                              )}
                            </Box>
                            <Chip
                              label={confirmedThisPdf ? 'Confirmed' : 'Pending'}
                              color={confirmedThisPdf ? 'success' : 'warning'}
                              size="small"
                              variant="soft"
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Worker Confirmation Button */}
                {onConfirmTmp && !currentPdf.worker_confirmed && (
                  <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => onConfirmTmp(currentPdf.id)}
                      startIcon={<Iconify icon="solar:check-circle-bold" />}
                      sx={{
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      }}
                    >
                      Confirm This TMP
                    </Button>
                  </Box>
                )}

                {/* Worker Already Confirmed Badge */}
                {onConfirmTmp && currentPdf.worker_confirmed && (
                  <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'success.lighter',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:check-circle-bold" width={20} sx={{ color: 'success.main' }} />
                      <Typography variant="body2" color="success.darker" fontWeight="medium">
                        You have confirmed this TMP
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </CardContent>
    </Box>
  );
}

