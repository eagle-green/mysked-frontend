import type { NewHire } from 'src/types/new-hire';

import { useQuery } from '@tanstack/react-query';
import { BlobProvider } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { MobileBlobPdfPages } from 'src/components/pdf/mobile-blob-pdf-pages';

import HiringPackagePdfTemplate from '../hiring-package/template/hiring-package-template';

// ----------------------------------------------------------------------

function formatHiringPackageStatusLabel(status: string): string {
  const words = status.replace(/_/g, ' ').trim().split(/\s+/);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

type PackagePayload = {
  id: string;
  display_id: number | null;
  status: string;
  submitted_at: string | null;
  form_data: NewHire;
};

type Props = {
  employeeUserId: string;
};

export function UserHiringPackageSection({ employeeUserId }: Props) {
  /** Same as FLRA PDF preview — mobile layout below 768px. */
  const isMobile = useMediaQuery('(max-width:768px)');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hiring-package-by-employee', employeeUserId],
    queryFn: async (): Promise<PackagePayload | null> => {
      try {
        const res = await axiosInstance.get<{ data: PackagePayload }>(
          endpoints.hiringPackages.byEmployee(employeeUserId)
        );
        return res.data?.data ?? null;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(employeeUserId),
  });

  if (isLoading) {
    return (
      <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    const msg =
      (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Could not load hiring package.';
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {typeof msg === 'string' ? msg : 'Could not load hiring package.'}
      </Alert>
    );
  }

  /** 404 → queryFn returns null */
  if (data === null && !isError) {
    return (
      <>
        <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Hiring package
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No digital hiring package is linked to this employee (for example, if they were added manually
          instead of through onboarding submit).
        </Typography>
      </>
    );
  }

  if (!data?.form_data) {
    return null;
  }

  const payload = data.form_data;

  return (
    <>
      <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6">Hiring package</Typography>
        <Typography variant="body2" color="text.secondary">
          Digital copy from onboarding
          {data.display_id != null ? ` · Package #${data.display_id}` : ''}
          {data.submitted_at ? ` · Submitted ${fDate(data.submitted_at)}` : ''}
          {data.status ? ` · ${formatHiringPackageStatusLabel(data.status)}` : ''}
        </Typography>
      </Stack>
      <Card variant="outlined" sx={{ overflow: 'hidden', bgcolor: 'grey.100' }}>
        <Box sx={{ minHeight: { xs: 320, md: 420 }, position: 'relative' }}>
          <BlobProvider document={<HiringPackagePdfTemplate data={payload} />}>
            {({ url, loading, error: pdfError }) => (
              <>
                {loading && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 360,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                {pdfError ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    {pdfError.message ||
                      'Could not render the hiring package PDF. Try refreshing the page.'}
                  </Alert>
                ) : null}
                {url && !loading && !isMobile ? (
                  <Box
                    component="iframe"
                    title="Hiring package"
                    src={url}
                    sx={{
                      width: '100%',
                      height: 520,
                      minHeight: 360,
                      border: 'none',
                      display: 'block',
                      bgcolor: 'grey.100',
                    }}
                  />
                ) : null}
                {url && !loading && isMobile ? (
                  <MobileBlobPdfPages
                    fileUrl={url}
                    scrollAreaMaxHeight="min(72vh, 780px)"
                  />
                ) : null}
              </>
            )}
          </BlobProvider>
        </Box>
      </Card>
    </>
  );
}
