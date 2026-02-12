import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useParams, usePathname } from 'src/routes/hooks';

import { useAnnouncementCategories } from 'src/hooks/use-announcement-categories';

import { getCategoryColor } from 'src/utils/category-colors';

import { useSignAnnouncement, useGetAnnouncementById, useMarkAnnouncementAsRead, useGetAnnouncementTracking } from 'src/actions/announcements';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';

/** Resolve category hex from announcement categoryColors/category_colors or from API categories by name. */
function getCategoryHex(
  announcement: { categoryColors?: Record<string, string> | null; category_colors?: Record<string, string> | null },
  categoryName: string,
  apiCategories?: { name: string; color: string | null }[]
): string | undefined {
  const trimmed = categoryName.trim();
  let map = announcement.categoryColors ?? announcement.category_colors ?? null;
  if (typeof map === 'string') {
    try {
      const parsed = JSON.parse(map);
      map = typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      map = null;
    }
  }
  if (map && typeof map === 'object') {
    const exact = map[trimmed];
    if (exact && typeof exact === 'string' && exact.startsWith('#')) return exact;
    const lower = trimmed.toLowerCase();
    const key = Object.keys(map).find((k) => k.trim().toLowerCase() === lower);
    const fromKey = key && map[key] && String(map[key]).startsWith('#') ? String(map[key]) : undefined;
    if (fromKey) return fromKey;
  }
  const fromApi = apiCategories?.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (fromApi?.color && typeof fromApi.color === 'string' && fromApi.color.startsWith('#')) return fromApi.color;
  return undefined;
}

export function AnnouncementDetailsView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();
  const { id } = useParams();
  const isCompanyPath = pathname?.startsWith('/company/announcements') ?? false;
  const listPath = isCompanyPath ? paths.company.announcements.list : paths.management.announcements.list;
  const [acknowledged, setAcknowledged] = useState(false);
  const { data: announcement, isLoading, error } = useGetAnnouncementById(id!);
  const { data: tracking, isLoading: trackingLoading, isError: trackingError } = useGetAnnouncementTracking(id ?? '');
  const { categories: apiCategories } = useAnnouncementCategories();
  const markAsRead = useMarkAnnouncementAsRead();
  const signAnnouncement = useSignAnnouncement();
  const markedAsReadRef = useRef<string | null>(null);

  useEffect(() => {
    // Only mark as read once per announcement ID to prevent infinite loop
    if (id && announcement?.id && markedAsReadRef.current !== id) {
      markedAsReadRef.current = id;
      markAsRead.mutate(id);
    }
  }, [id, announcement?.id, markAsRead]);

  const handleSign = async () => {
    if (!id || !acknowledged) return;
    try {
      await signAnnouncement.mutateAsync({
        id,
        signatureData: { acknowledged: true, signedAt: new Date().toISOString() },
      });
      toast.success('You have signed this announcement.');
      setAcknowledged(false);
    } catch {
      toast.error('Failed to submit signature. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      </Container>
    );
  }

  if (error || !announcement) {
    return (
      <Container maxWidth={false} sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Announcement not found!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>The announcement doesn&apos;t exist or has been removed.</Typography>
        <Button component={RouterLink} href={listPath} startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />} variant="contained">
          Back to list
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>{announcement.title}</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>{announcement.description}</Typography>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ mb: announcement.requiresSignature ? 1 : 0 }} flexWrap="wrap">
            {announcement.category
              ? (typeof announcement.category === 'string'
                  ? announcement.category.split(', ')
                  : Array.isArray(announcement.category)
                    ? announcement.category
                    : []
                )
                  .filter(Boolean)
                  .map((cat: string, index: number) => {
                    const trimmed = cat.trim();
                    const hex = getCategoryHex(announcement, trimmed, apiCategories);
                    if (hex && /^#[0-9A-Fa-f]{3,8}$/.test(hex)) {
                      let textColor = '#000';
                      try {
                        textColor = theme.palette.getContrastText(hex);
                      } catch {
                        textColor = parseInt(hex.slice(1), 16) > 0xffffff / 2 ? '#000' : '#fff';
                      }
                      return (
                        <Box
                          key={index}
                          component="span"
                          sx={{
                            px: 0.75,
                            height: isMobile ? 32 : 24,
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: isMobile ? '0.9375rem' : '0.75rem',
                            fontWeight: 700,
                            borderRadius: 0.75,
                            backgroundColor: hex,
                            color: textColor,
                          }}
                        >
                          {trimmed}
                        </Box>
                      );
                    }
                    return (
                      <Label key={index} variant="soft" color={getCategoryColor(trimmed)} sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>
                        {trimmed}
                      </Label>
                    );
                  })
              : null}
          </Stack>
          {announcement.requiresSignature && (
            <Stack direction="row" sx={{ mb: 1 }}>
              <Label color="warning" sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>Requires signature</Label>
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary">
            By {announcement.author.name} • {new Date(announcement.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ typography: 'body1' }}>
        <Markdown>{announcement.content}</Markdown>
      </Box>

      {announcement.requiresSignature && (
        <Box sx={{ mt: 4 }}>
          {announcement.recipientStatus?.signedAt ? (
            <Card sx={{ p: 2, bgcolor: 'success.lighter' }}>
              <Typography variant="subtitle2" color="success.darker">
                <Iconify icon="eva:checkmark-fill" width={20} sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                You signed this announcement on {new Date(announcement.recipientStatus.signedAt).toLocaleString()}.
              </Typography>
            </Card>
          ) : (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Acknowledgment required</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please confirm you have read and acknowledge this announcement, then sign below.
              </Typography>
              <FormControlLabel
                control={<Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />}
                label="I have read and acknowledge this announcement"
                sx={{ display: 'block', mb: 2 }}
              />
              <Button
                variant="contained"
                size={isMobile ? 'large' : 'medium'}
                fullWidth={isMobile}
                onClick={handleSign}
                disabled={!acknowledged || signAnnouncement.isPending}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                {signAnnouncement.isPending ? 'Submitting…' : 'Sign'}
              </Button>
            </Card>
          )}
        </Box>
      )}

      {!trackingError && tracking !== undefined && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recipients & tracking</Typography>
          {trackingLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
          ) : tracking.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No recipients for this announcement.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Sent</TableCell>
                    <TableCell>Opened</TableCell>
                    {announcement.requiresSignature && <TableCell>Signed</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tracking.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <Typography variant="body2">{row.userName || row.userEmail || row.userId}</Typography>
                        {row.userEmail && <Typography variant="caption" color="text.secondary" display="block">{row.userEmail}</Typography>}
                      </TableCell>
                      <TableCell>{row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}</TableCell>
                      <TableCell>{row.readAt ? new Date(row.readAt).toLocaleString() : '—'}</TableCell>
                      {announcement.requiresSignature && <TableCell>{row.signedAt ? new Date(row.signedAt).toLocaleString() : '—'}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );
}
