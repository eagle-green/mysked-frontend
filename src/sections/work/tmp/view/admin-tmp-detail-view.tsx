import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { ChangeEvent } from 'react';

import { useState } from 'react';
import { Page, Document } from 'react-pdf';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import { Dialog, IconButton, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate, fTime} from 'src/utils/format-time';
import { getSignedUrlViaBackend } from 'src/utils/backend-storage';

import axios from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TmpPdfCarousel } from '../components/tmp-pdf-carousel';

// ----------------------------------------------------------------------

type Props = {
  id: string;
  embedded?: boolean;
};

export function AdminTmpDetailView({ id, embedded = false }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null); // For editing existing PDF notes

  // Fetch TMP data with React Query
  const { data: tmpResponse, isLoading: loading } = useQuery({
    queryKey: ['admin-tmp-detail', id],
    queryFn: async () => {
      const response = await axios.get(`/api/tmp/${id}`);
      const tmpForm = response.data.data.tmp_form;
      const tmpWorkers = response.data.data.workers || [];
      
      // Get signed URLs for all PDFs
      let pdfsWithSignedUrls: any[] = [];
      if (tmpForm.pdfs && tmpForm.pdfs.length > 0) {
        pdfsWithSignedUrls = await Promise.all(
          tmpForm.pdfs.map(async (pdf: any) => {
            try {
              const signedUrl = await getSignedUrlViaBackend(pdf.pdf_url, 'tmp-pdfs');
              return { ...pdf, pdf_url: signedUrl };
            } catch (error) {
              console.error(`Error getting signed URL for PDF ${pdf.id}:`, error);
              return pdf;
            }
          })
        );
      }
      
      return {
        tmpData: tmpForm,
        pdfs: pdfsWithSignedUrls,
        workers: tmpWorkers,
      };
    },
    enabled: !!id,
  });

  const tmpData = tmpResponse?.tmpData;
  const pdfs = tmpResponse?.pdfs || [];
  const workers = tmpResponse?.workers || [];

  // Handle file selection for new PDF
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setPdfFile(file);
    setNotes(''); // Clear notes for new PDF
    setEditingPdfId(null); // Not editing, creating new
    
    // Create blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    setPdfUrl(blobUrl);
    
    // Open preview dialog
    setPreviewDialogOpen(true);
  };

  // Handle upload and save
  const handleUploadAndSaveNotes = async () => {
    if (!pdfFile) {
      toast.error('No PDF file selected');
      return;
    }

    try {
      setUploading(true);
      const uploadToast = toast.loading('Uploading PDF...');

      // Upload PDF to Supabase via backend
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('bucket', 'tmp-pdfs');

      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedPath = uploadResponse.data.data.path;

      // Add PDF to TMP via API
      await axios.post(`/api/tmp/${id}/pdfs`, {
        pdf_url: uploadedPath,
        pdf_filename: pdfFile.name,
        notes: notes || null,
      });

      toast.dismiss(uploadToast);
      toast.success('TMP PDF uploaded successfully!');

      // Reset states
      setPdfFile(null);
      setPdfUrl(null);
      setNotes('');
      setPreviewDialogOpen(false);

      // Refresh data and set to the newly uploaded PDF
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-list'] });
    } catch (error: any) {
      console.error('Error uploading TMP PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to upload TMP PDF');
    } finally {
      setUploading(false);
    }
  };

  // Handle saving notes for existing PDF
  const handleSaveNotesOnly = async () => {
    if (!editingPdfId) return;

    try {
      setUploading(true);

      await axios.put(`/api/tmp/${id}/pdfs/${editingPdfId}`, {
        notes: notes || null,
      });

      toast.success('Notes saved successfully!');

      // Reset states
      setNotes('');
      setEditingPdfId(null);
      setPreviewDialogOpen(false);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-list'] });
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error(error.response?.data?.error || 'Failed to save notes');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete PDF
  const handleDeletePdf = async () => {
    const deleteId = pdfToDelete;
    if (!deleteId) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/tmp/${id}/pdfs/${deleteId}`);
      toast.success('TMP PDF deleted successfully');

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tmp-list'] });
    } catch (error: any) {
      console.error('Error deleting PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to delete PDF');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPdfToDelete(null);
    }
  };

  // Handle adding new TMP
  const handleAddNewTmp = () => {
    // Trigger file input
    const fileInput = document.getElementById('add-tmp-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleBack = () => {
    router.push(paths.work.job.tmp.list);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'submitted':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!tmpData) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            TMP not found
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Back to TMP List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  const canEdit = true; // Admins can always edit

  return (
    <DashboardContent>
      {!embedded && (
        <CustomBreadcrumbs
          heading="Traffic Management Plan"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Work Management', href: paths.work.root },
            { name: 'TMP', href: paths.work.job.tmp.list },
            { name: `Job #${tmpData.job?.job_number}` },
          ]}
          action={
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
            >
              Back
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />
      )}

      <Stack spacing={3}>
        {/* Job & Client Information */}
        <Card>
          <CardHeader 
            title="Job Information"
            action={
              <Label color={getStatusColor(tmpData.status)} variant="soft">
                {tmpData.status}
              </Label>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Job Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  #{tmpData.job?.job_number}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Site
                </Typography>
                <Typography variant="body1">{tmpData.site?.name}</Typography>
                {tmpData.site?.display_address && (
                  <Typography variant="caption" color="text.secondary">
                    {tmpData.site.display_address}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Client
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                  <Avatar
                    src={tmpData.client?.logo_url}
                    alt={tmpData.client?.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {tmpData.client?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </Avatar>
                  <Typography variant="body1">{tmpData.client?.name}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {tmpData.job?.start_time ? fDate(tmpData.job.start_time) : '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Timesheet Manager
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                  <Avatar
                    src={tmpData.timesheet_manager?.photo_url}
                    sx={{ width: 32, height: 32 }}
                  >
                    {tmpData.timesheet_manager?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="body1">
                    {tmpData.timesheet_manager?.first_name} {tmpData.timesheet_manager?.last_name}
                  </Typography>
                </Box>
              </Box>

              {tmpData.submitted_at && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Submitted By
                  </Typography>
                  <Typography variant="body1">
                    {tmpData.submitted_by?.first_name} {tmpData.submitted_by?.last_name} on{' '}
                    {fDate(tmpData.submitted_at)} at {fTime(tmpData.submitted_at)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Traffic Management Plan PDFs */}
        <Card>
          <CardHeader 
            title="Traffic Management Plan"
            action={
              canEdit && (
                <>
                  <input
                    id="add-tmp-file-input"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddNewTmp}
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Add TMP
                  </Button>
                </>
              )
            }
          />
          <CardContent sx={{ p: { xs: 0, md: 3 } }}>
            <TmpPdfCarousel
              pdfs={pdfs}
              workers={workers}
              timesheetManagerId={tmpData.timesheet_manager?.id}
              initialIndex={pdfs.length > 0 ? pdfs.length - 1 : 0}
              onAddNewPdf={handleAddNewTmp}
              onDeletePdf={(pdfId) => {
                setPdfToDelete(pdfId);
                setDeleteDialogOpen(true);
              }}
              canEdit={canEdit}
              embedded
            />
          </CardContent>
        </Card>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete TMP PDF?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this TMP PDF? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePdf}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview & Notes Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPdfFile(null);
          setPdfUrl(null);
          setNotes('');
          setEditingPdfId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ position: 'relative', pr: 6 }}>
          <Typography variant="h6">
            {editingPdfId ? 'Edit TMP Notes' : 'Upload TMP PDF'}
          </Typography>
          {pdfFile && (
            <Typography variant="body2" color="text.secondary">
              {pdfFile.name}
            </Typography>
          )}
          <IconButton
            onClick={() => {
              setPreviewDialogOpen(false);
              setPdfFile(null);
              setPdfUrl(null);
              setNotes('');
              setEditingPdfId(null);
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {pdfUrl && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  PDF Preview
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '& .react-pdf__Page': {
                      maxWidth: '100%',
                    },
                    '& .react-pdf__Page__canvas': {
                      width: '100% !important',
                      height: 'auto !important',
                    },
                  }}
                >
                  <Document
                    file={pdfUrl}
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
                      width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.6, 800) : 800}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </Box>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for this TMP (optional)"
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setPreviewDialogOpen(false);
              setPdfFile(null);
              setPdfUrl(null);
              setNotes('');
              setEditingPdfId(null);
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={editingPdfId ? handleSaveNotesOnly : handleUploadAndSaveNotes}
            loading={uploading}
          >
            {editingPdfId ? 'Save Notes' : 'Upload TMP & Save Notes'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
