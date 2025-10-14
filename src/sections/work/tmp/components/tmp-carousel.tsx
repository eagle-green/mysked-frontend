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
  confirmed: boolean;
  confirmed_at?: string;
  confirmation_note?: string;
};

type TmpForm = {
  id: string;
  status: string;
  created_at: string;
  pdf_url?: string;
  pdf_filename?: string;
  notes?: string;
  workerConfirmed?: boolean; // Worker's confirmation status for this specific TMP
  created_by: {
    first_name: string;
    last_name: string;
  };
};

type Props = {
  tmpForms: TmpForm[];
  workers?: Worker[];
  timesheetManagerId?: string;
  currentTmpId?: string;
  onSelectTmp: (tmpId: string) => void;
  onAddNewTmp: () => void;
  onConfirmTmp?: (tmpId: string) => void; // For worker confirmation
  onDeleteTmp?: (tmpId: string) => void; // For admin deletion
  canEdit?: boolean;
  embedded?: boolean; // When true, don't show outer card wrapper
  hideWorkerCount?: boolean; // When true, hide the worker count in header
  hideWorkers?: boolean; // When true, completely hide the workers section
  hideAddedBy?: boolean; // When true, hide the "Added By" section
};

export function TmpCarousel({ tmpForms, workers = [], timesheetManagerId, currentTmpId, onSelectTmp, onAddNewTmp, onConfirmTmp, onDeleteTmp, canEdit = false, embedded = false, hideWorkerCount = false, hideWorkers = false, hideAddedBy = false }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync carousel index with currentTmpId
  useEffect(() => {
    if (currentTmpId && tmpForms.length > 0) {
      const index = tmpForms.findIndex((tmp) => tmp.id === currentTmpId);
      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }, [currentTmpId, tmpForms, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tmpForms.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < tmpForms.length - 1 ? prev + 1 : 0));
  };

  if (tmpForms.length === 0) {
    const emptyContent = (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Iconify icon="solar:file-text-bold" sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No TMPs Added Yet
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Click &quot;Add TMP&quot; button above to upload your first Traffic Management Plan
        </Typography>
      </Box>
    );

    return embedded ? emptyContent : <Card><CardContent>{emptyContent}</CardContent></Card>;
  }

  const currentTmp = tmpForms[currentIndex];

  const carouselContent = (
    <Box>
        {/* Carousel Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handlePrevious} disabled={tmpForms.length <= 1}>
            <Iconify icon="carbon:chevron-left" />
          </IconButton>

          {/* Current TMP Card with PDF Preview */}
          <Box sx={{ flex: 1 }}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                border: currentTmpId === currentTmp.id ? '2px solid' : '1px solid',
                borderColor: currentTmpId === currentTmp.id ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => onSelectTmp(currentTmp.id)}
            >
              {/* PDF Preview - Full Width as Image */}
              {currentTmp.pdf_url ? (
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'grey.100',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9,
                    },
                    '& .react-pdf__Document': {
                      width: '100%',
                    },
                    '& .react-pdf__Page': {
                      maxWidth: '100%',
                    },
                    '& .react-pdf__Page__canvas': {
                      width: '100% !important',
                      height: 'auto !important',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering onSelectTmp
                    window.open(currentTmp.pdf_url, '_blank');
                  }}
                >
                  <Document
                    key={currentTmp.id}
                    file={currentTmp.pdf_url}
                    loading={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 400,
                          width: '100%',
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    }
                    error={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 400,
                          width: '100%',
                          gap: 1,
                        }}
                      >
                        <Iconify icon="solar:file-corrupted-bold-duotone" sx={{ fontSize: 60, color: 'error.main' }} />
                        <Typography variant="body2" color="error">
                          Failed to load PDF
                        </Typography>
                      </Box>
                    }
                  >
                    <Page
                      pageNumber={1}
                      width={Math.min(window.innerWidth * 0.8, 1200)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <Skeleton
                          variant="rectangular"
                          width="100%"
                          height={776}
                          sx={{ borderRadius: 1 }}
                        />
                      }
                    />
                  </Document>
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

              <CardContent>
                <Stack spacing={1.5}>
                  {/* Header with TMP number, delete button, and optionally Added By */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        TMP #{currentIndex + 1}
                      </Typography>
                      {canEdit && onDeleteTmp && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTmp(currentTmp.id);
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
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Added By:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                            {currentTmp.created_by.first_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {currentTmp.created_by.first_name} {currentTmp.created_by.last_name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled" display="block">
                          {fDate(currentTmp.created_at)} at {fTime(currentTmp.created_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* TMP File Title */}
                  {currentTmp.pdf_filename && (
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {currentTmp.pdf_filename}
                      </Typography>
                    </Box>
                  )}

                  {/* Notes Preview */}
                  {currentTmp.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Notes:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {currentTmp.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Workers Confirmation Status - Only show for admins */}
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
                                label={worker.confirmed ? 'Confirmed' : 'Pending'}
                                color={worker.confirmed ? 'success' : 'warning'}
                                size="small"
                                variant="soft"
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Confirm Button for Worker View */}
                  {onConfirmTmp && !currentTmp.workerConfirmed && (
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmTmp(currentTmp.id);
                        }}
                        startIcon={<Iconify icon="solar:check-circle-bold" />}
                        sx={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        }}
                      >
                        Confirm This TMP
                      </Button>
                    </Box>
                  )}

                  {/* Confirmed Badge for Worker View */}
                  {onConfirmTmp && currentTmp.workerConfirmed && (
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
          </Box>

          <IconButton onClick={handleNext} disabled={tmpForms.length <= 1}>
            <Iconify icon="carbon:chevron-right" />
          </IconButton>
        </Box>

        {/* Counter and Dots at Bottom Center */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {currentIndex + 1} of {tmpForms.length}
          </Typography>
          {tmpForms.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {tmpForms.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: index === currentIndex ? 'primary.main' : 'grey.300',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: index === currentIndex ? 'primary.dark' : 'grey.400',
                    },
                  }}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </Box>
          )}
        </Box>
    </Box>
  );

  return embedded ? carouselContent : <Card><CardContent>{carouselContent}</CardContent></Card>;
}
