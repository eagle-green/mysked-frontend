import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { getSignedUrlViaBackend } from 'src/utils/backend-storage';

import { DashboardContent } from 'src/layouts/dashboard';
import axios, { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TmpPdfCarousel } from 'src/sections/work/tmp/components/tmp-pdf-carousel';

// ----------------------------------------------------------------------

export function TmpDetailView() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tmpId = params.id as string;

  const [confirming, setConfirming] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [pdfsWithSignedUrls, setPdfsWithSignedUrls] = useState<any[]>([]);
  const [confirmingPdfId, setConfirmingPdfId] = useState<string | null>(null);

  // Fetch TMP details
  const { data: tmpResponse, isLoading, error } = useQuery({
    queryKey: ['worker-tmp-detail', tmpId],
    queryFn: async () => {
      const response = await fetcher(endpoints.tmp.detail.replace(':id', tmpId));
      return response.data;
    },
    enabled: !!tmpId,
  });

  const tmpData = tmpResponse?.tmp_form;

  // Fetch signed URLs for PDFs
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!tmpData?.pdfs || tmpData.pdfs.length === 0) {
        setPdfsWithSignedUrls([]);
        return;
      }

      const pdfsWithUrls = await Promise.all(
        tmpData.pdfs.map(async (pdf: any) => {
          try {
            const signedUrl = await getSignedUrlViaBackend(pdf.pdf_url, 'tmp-pdfs');
            return { ...pdf, pdf_url: signedUrl };
          } catch (err) {
            console.error(`Error getting signed URL for PDF ${pdf.id}:`, err);
            return pdf;
          }
        })
      );

      setPdfsWithSignedUrls(pdfsWithUrls);
    };

    if (tmpData) {
      fetchSignedUrls();
    }
  }, [tmpData]);

  const handleBack = () => {
    router.push(paths.schedule.work.tmp.list);
  };

  const handleConfirm = async () => {
    if (!acknowledged) {
      toast.error('Please acknowledge that you have read and understood the TMP');
      return;
    }

    if (!confirmingPdfId) {
      toast.error('No PDF selected for confirmation');
      return;
    }

    try {
      setConfirming(true);
      await axios.post(`/api/tmp/${tmpId}/pdfs/${confirmingPdfId}/confirm`);
      toast.success('TMP PDF confirmed successfully');
      setConfirmDialogOpen(false);
      setAcknowledged(false);
      setConfirmingPdfId(null);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['worker-tmp-detail'] });
      queryClient.invalidateQueries({ queryKey: ['worker-tmp-list'] });
    } catch (err: any) {
      console.error('Error confirming TMP:', err);
      toast.error(err.response?.data?.error || 'Failed to confirm TMP');
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !tmpData) {
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

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Traffic Management Plan"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'TMP', href: paths.schedule.work.tmp.list },
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

      <Stack spacing={3}>
        {/* Job & Client Information */}
        <Card>
          <CardHeader title="Job Information" />
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
            </Stack>
          </CardContent>
        </Card>

        {/* Traffic Management Plans Carousel */}
        <Card>
          <CardHeader title="Traffic Management Plans" />
          <CardContent>
            <TmpPdfCarousel
              pdfs={pdfsWithSignedUrls}
              hideWorkers
              hideAddedBy
              onConfirmTmp={(pdfId) => {
                setConfirmingPdfId(pdfId);
                setConfirmDialogOpen(true);
              }}
              canEdit={false}
              embedded
            />
          </CardContent>
        </Card>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setAcknowledged(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:shield-check-bold" width={28} color="success.main" />
            <Typography variant="h6">Confirm Traffic Management Plan</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              Please confirm that you have reviewed and understood the Traffic Management Plan for this job.
            </Typography>

            <Box
              sx={{
                p: 2,
                bgcolor: 'warning.lighter',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                ⚠️ Important
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, color: '#1C252E' }}>
                By confirming, you acknowledge that:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2, '& li': { mb: 0.5 } }}>
                <li>
                  <Typography variant="body2" sx={{ color: '#1C252E' }}>
                    You have read and understood all TMPs for this job
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ color: '#1C252E' }}>
                    You will follow the traffic management procedures outlined
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ color: '#1C252E' }}>
                    You understand the safety requirements and protocols
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ color: '#1C252E' }}>
                    You will report any concerns or issues immediately
                  </Typography>
                </li>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
              }
              label="I have read and understood the Traffic Management Plan(s) and agree to follow all procedures"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => {
            setConfirmDialogOpen(false);
            setAcknowledged(false);
          }}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="success"
            onClick={handleConfirm}
            loading={confirming}
            disabled={!acknowledged}
          >
            Confirm TMP
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
