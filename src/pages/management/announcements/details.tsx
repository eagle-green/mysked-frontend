import type { AnnouncementTrackingItem } from 'src/actions/announcements';

import { pdf } from '@react-pdf/renderer';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Menu from '@mui/material/Menu';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useParams, usePathname } from 'src/routes/hooks';

import { useAnnouncementCategories } from 'src/hooks/use-announcement-categories';

import { fDate } from 'src/utils/format-time';
import { getRoleDisplayInfo } from 'src/utils/format-role';
import { getCategoryColor } from 'src/utils/category-colors';

import { CONFIG } from 'src/global-config';
import { AnnouncementRecipientPdf } from 'src/pages/template/announcement-recipient-pdf';
import { useSignAnnouncement, useDeleteAnnouncement, useGetAnnouncementById, useMarkAnnouncementAsRead, useGetAnnouncementTracking } from 'src/actions/announcements';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { rowInPage } from 'src/components/table/utils';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TimeSheetSignatureDialog } from 'src/sections/schedule/timesheet/template/timesheet-signature';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

const metadata = { title: `Announcement Details | ${CONFIG.appName}` };

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

/** Description is only shown when it has content (not empty and not placeholder-like text). */
function hasDescription(description: string | null | undefined): boolean {
  const t = description?.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower === 'sub title optional' || lower === 'sub title (optional)') return false;
  return true;
}

export default function AnnouncementDetailsPage() {
  const { id } = useParams();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthContext();
  const isCompanyPath = Boolean(pathname?.includes('/company/announcements'));
  const listPath = isCompanyPath ? paths.company.announcements.list : paths.management.announcements.list;
  const [acknowledged, setAcknowledged] = useState(false);
  const { data: announcement, isLoading, error: announcementError } = useGetAnnouncementById(id!);
  const { categories: apiCategories } = useAnnouncementCategories();
  const deleteAnnouncement = useDeleteAnnouncement();
  const markAsRead = useMarkAnnouncementAsRead();
  const signAnnouncement = useSignAnnouncement();
  const signatureDialog = useBoolean();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const canEdit = user?.role === 'admin';
  const [currentTab, setCurrentTab] = useState(0);
  const [trackingMenuAnchor, setTrackingMenuAnchor] = useState<null | HTMLElement>(null);
  const [trackingRowForAction, setTrackingRowForAction] = useState<{
    userId: string;
    userName: string;
    userEmail: string | null;
    readAt: string | null;
    signedAt: string | null;
    signatureData: unknown;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogSrc, setImageDialogSrc] = useState<string | null>(null);
  const { data: tracking = [], isLoading: trackingLoading } = useGetAnnouncementTracking(id ?? '', canEdit);
  const queryClient = useQueryClient();

  type TrackingFilter = 'all' | 'unread' | 'read' | 'signed' | 'did_not_sign';
  const [trackingFilter, setTrackingFilter] = useState<TrackingFilter>('all');
  const requiresSignature = Boolean(announcement?.requiresSignature);
  useEffect(() => {
    if (!requiresSignature && (trackingFilter === 'signed' || trackingFilter === 'did_not_sign')) {
      setTrackingFilter('all');
    }
  }, [requiresSignature, trackingFilter]);

  const filteredTracking = useMemo(() => {
    if (trackingFilter === 'all') return tracking;
    return tracking.filter((row: AnnouncementTrackingItem) => {
      if (trackingFilter === 'unread') return !row.readAt;
      if (trackingFilter === 'read') return !!row.readAt;
      if (trackingFilter === 'signed') return !!row.signedAt;
      if (trackingFilter === 'did_not_sign') return requiresSignature && !row.signedAt;
      return true;
    });
  }, [tracking, trackingFilter, requiresSignature]);

  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingPage, setTrackingPage] = useState(0);
  const [trackingRowsPerPage, setTrackingRowsPerPage] = useState(10);
  const trackingFilteredBySearch = useMemo(() => {
    const q = trackingSearch.trim().toLowerCase();
    if (!q) return filteredTracking;
    return filteredTracking.filter(
      (row: AnnouncementTrackingItem) =>
        (row.userName ?? '').toLowerCase().includes(q) ||
        (row.userEmail ?? '').toLowerCase().includes(q) ||
        (row.userId ?? '').toLowerCase().includes(q)
    );
  }, [filteredTracking, trackingSearch]);
  const trackingInPage = useMemo(
    () => rowInPage(trackingFilteredBySearch, trackingPage, trackingRowsPerPage),
    [trackingFilteredBySearch, trackingPage, trackingRowsPerPage]
  );
  const handleTrackingPageChange = (_: unknown, newPage: number) => setTrackingPage(newPage);
  const handleTrackingRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingRowsPerPage(parseInt(event.target.value, 10));
    setTrackingPage(0);
  };

  const handleImageClick = (src: string) => {
    if (isMobile) {
      setImageDialogSrc(src);
      setImageDialogOpen(true);
    }
  };

  const handleImageDialogClose = () => {
    setImageDialogOpen(false);
    setImageDialogSrc(null);
  };

  useEffect(() => {
    if (id && announcement?.id) {
      markAsRead.mutate(id);
    }
  }, [id, announcement?.id, markAsRead]);

  // Invalidate list when leaving detail so "Opened at" is fresh when user returns to Company list
  useEffect(() => () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }, [queryClient]);

  const handleSignatureSave = async (signature: string | null) => {
    if (!id || !signature) return;
    try {
      await signAnnouncement.mutateAsync({
        id,
        signatureData: { signature, signedAt: new Date().toISOString(), acknowledged: true },
      });
      toast.success('You have signed this announcement.');
      setAcknowledged(false);
    } catch {
      toast.error('Failed to submit signature. Please try again.');
    } finally {
      signatureDialog.onFalse();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteAnnouncement.mutateAsync(id);
      toast.success('Announcement deleted successfully!');
      window.location.href = listPath;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleTrackingMenuOpen = (event: React.MouseEvent<HTMLElement>, row: typeof tracking[0]) => {
    event.stopPropagation();
    setTrackingMenuAnchor(event.currentTarget);
    setTrackingRowForAction({
      userId: row.userId,
      userName: row.userName || row.userEmail || row.userId,
      userEmail: row.userEmail,
      readAt: row.readAt ?? null,
      signedAt: row.signedAt,
      signatureData: row.signatureData,
    });
  };

  const handleTrackingMenuClose = () => {
    setTrackingMenuAnchor(null);
    setTrackingRowForAction(null);
  };

  const handleDownloadRecipientPdf = async () => {
    if (!announcement || !trackingRowForAction) return;
    setDownloadingPdf(true);
    try {
      const sigData = trackingRowForAction.signatureData as { signature?: string } | null;
      const signatureUrl = sigData?.signature ?? null;
      const blob = await pdf(
        <AnnouncementRecipientPdf
          title={announcement.title}
          description={announcement.description}
          content={announcement.content}
          createdAt={announcement.createdAt}
          recipientName={trackingRowForAction.userName}
          recipientEmail={trackingRowForAction.userEmail}
          readAt={trackingRowForAction.readAt}
          requiresSignature={announcement.requiresSignature}
          signedAt={trackingRowForAction.signedAt}
          signatureDataUrl={signatureUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = announcement.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 50);
      const safeName = trackingRowForAction.userName.replace(/[^a-z0-9-_]/gi, '_').slice(0, 30);
      link.download = `Announcement_${safeTitle}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded.');
    } catch (e) {
      console.error('PDF download error:', e);
      toast.error('Failed to generate PDF.');
    } finally {
      setDownloadingPdf(false);
      handleTrackingMenuClose();
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
      </Container>
    );
  }

  if (announcementError || !announcement) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>Announcement Not Found</Typography>
          <Button component={RouterLink} href={listPath} variant="contained" size={isMobile ? 'large' : 'medium'} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Back to Announcements
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading={announcement.displayId != null ? `#${announcement.displayId} - ${announcement.title}` : announcement.title}
        links={[
          { name: isCompanyPath ? 'Company' : 'Management', href: listPath },
          { name: 'Announcements', href: listPath },
          { name: 'Details' },
          { name: announcement.displayId != null ? `#${announcement.displayId} - ${announcement.title}` : announcement.title },
        ]}
        sx={{ mb: 3 }}
        action={
          <Button component={RouterLink} href={listPath} variant="contained" size={isMobile ? 'large' : 'medium'} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Back to Announcements
          </Button>
        }
      />

      {canEdit ? (
        <>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 2 }}>
            <Tab label="Content" />
            <Tab label="Recipients & tracking" />
          </Tabs>
          {currentTab === 0 && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{announcement.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{fDate(announcement.createdAt)}</Typography>
                  </Stack>
                  {hasDescription(announcement.description) && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{announcement.description}</Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                    {announcement.category?.split(', ').map((category: string, index: number) => {
                      const trimmed = category.trim();
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
                        <Label key={index} variant="soft" color={getCategoryColor(trimmed)} sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>{trimmed}</Label>
                      );
                    })}
                  </Stack>
                  {announcement.requiresSignature && (
                    <Stack direction="row" sx={{ mb: 3 }}>
                      <Label color="warning" sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>Requires signature</Label>
                    </Stack>
                  )}
                  {!announcement.requiresSignature && <Box sx={{ mb: 3 }} />}
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Content</Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1, border: (t) => `1px solid ${t.palette.divider}` }}>
                    <Markdown
                      components={{
                        img: ({ node: _n, onLoad: _o, src, alt, ...props }) => (
                          <Box
                            component="img"
                            src={src}
                            alt={alt ?? ''}
                            {...props}
                            onClick={() => src && handleImageClick(src)}
                            role={isMobile ? 'button' : undefined}
                            sx={{
                              maxWidth: '100%',
                              height: 'auto',
                              display: 'block',
                              borderRadius: 2,
                              ...(isMobile && { cursor: 'pointer' }),
                            }}
                          />
                        ),
                      }}
                    >
                      {announcement.content}
                    </Markdown>
                  </Box>
                </Box>
                {Boolean(announcement.requiresSignature) && (
                  <Box>
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
                          onClick={() => signatureDialog.onTrue()}
                          disabled={!acknowledged || signAnnouncement.isPending}
                          startIcon={<Iconify icon="solar:pen-bold" />}
                        >
                          {signAnnouncement.isPending ? 'Submitting…' : 'Sign'}
                        </Button>
                      </Card>
                    )}
                  </Box>
                )}
              </Stack>
            </Card>
          )}
          {currentTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Who received the announcement, who opened it, and who signed (with signature image and time).
              </Typography>
              {trackingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
              ) : tracking.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No recipients for this announcement.</Typography>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Tabs
                      value={trackingFilter}
                      onChange={(_, v: TrackingFilter) => {
                        setTrackingFilter(v);
                        setTrackingPage(0);
                      }}
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      sx={(t) => ({
                        px: 2.5,
                        boxShadow: `inset 0 -2px 0 0 ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}`,
                      })}
                    >
                      {[
                        { value: 'all' as const, label: 'All', count: tracking.length, color: 'default' as const },
                        { value: 'unread' as const, label: 'Unread', count: tracking.filter((r) => !r.readAt).length, color: 'warning' as const },
                        { value: 'read' as const, label: 'Read', count: tracking.filter((r) => r.readAt).length, color: 'success' as const },
                        ...(requiresSignature
                          ? [
                              { value: 'did_not_sign' as const, label: 'Pending signature', count: tracking.filter((r) => !r.signedAt).length, color: 'warning' as const },
                              { value: 'signed' as const, label: 'Signed', count: tracking.filter((r) => r.signedAt).length, color: 'success' as const },
                            ]
                          : []),
                      ].map((tab) => (
                        <Tab
                          key={tab.value}
                          iconPosition="end"
                          value={tab.value}
                          label={tab.label}
                          icon={
                            <Label
                              variant={tab.value === trackingFilter ? 'filled' : 'soft'}
                              color={tab.color}
                            >
                              {tab.count}
                            </Label>
                          }
                        />
                      ))}
                    </Tabs>
                  </Box>
                  <TextField
                    placeholder="Search by worker name or email..."
                    value={trackingSearch}
                    onChange={(e) => {
                      setTrackingSearch(e.target.value);
                      setTrackingPage(0);
                    }}
                    size="small"
                    sx={{ mb: 2, minWidth: 280 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TableContainer component={Card} variant="outlined" sx={{ overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Sent</TableCell>
                          <TableCell>Opened</TableCell>
                          {Boolean(announcement.requiresSignature) && (
                            <>
                              <TableCell>Signed at</TableCell>
                              <TableCell>Signature</TableCell>
                            </>
                          )}
                          <TableCell align="right" sx={{ width: 48 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trackingInPage.map((row) => {
                        const sigData = row.signatureData as { signature?: string } | null;
                        const signatureImageUrl = sigData?.signature ?? null;
                        return (
                          <TableRow key={row.userId}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  src={row.userAvatar ?? undefined}
                                  alt={row.userName || row.userEmail || ''}
                                  sx={{ width: 36, height: 36 }}
                                >
                                  {(row.userName?.charAt(0) || row.userEmail?.charAt(0) || '?').toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
                                    <Typography variant="body2">{row.userName || row.userEmail || row.userId}</Typography>
                                    {row.userRole && (() => {
                                      const roleInfo = getRoleDisplayInfo(row.userRole);
                                      return roleInfo.label ? (
                                        <Label variant="soft" color={roleInfo.color} sx={{ fontSize: '0.7rem', height: 20 }}>
                                          {roleInfo.label}
                                        </Label>
                                      ) : null;
                                    })()}
                                  </Stack>
                                  {row.userEmail && <Typography variant="caption" color="text.secondary" display="block">{row.userEmail}</Typography>}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}</TableCell>
                            <TableCell>{row.readAt ? new Date(row.readAt).toLocaleString() : '—'}</TableCell>
                            {Boolean(announcement.requiresSignature) && (
                              <>
                                <TableCell>{row.signedAt ? new Date(row.signedAt).toLocaleString() : '—'}</TableCell>
                                <TableCell>
                                  {signatureImageUrl ? (
                                    <Box component="span" sx={{ display: 'inline-block', border: 1, borderColor: 'divider', borderRadius: 1, p: 0.5, bgcolor: 'background.paper' }}>
                                      <Box component="img" src={signatureImageUrl} alt="Signature" sx={{ maxHeight: 48, maxWidth: 180, display: 'block' }} />
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                  )}
                                </TableCell>
                              </>
                            )}
                            <TableCell align="right">
                              <IconButton size="small" onClick={(e) => handleTrackingMenuOpen(e, row)} aria-label="Actions">
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePaginationCustom
                    count={trackingFilteredBySearch.length}
                    page={trackingPage}
                    rowsPerPage={trackingRowsPerPage}
                    onPageChange={handleTrackingPageChange}
                    onRowsPerPageChange={handleTrackingRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </>
              )}
              <Menu
                anchorEl={trackingMenuAnchor}
                open={Boolean(trackingMenuAnchor)}
                onClose={handleTrackingMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={handleDownloadRecipientPdf}
                  disabled={downloadingPdf}
                >
                  <Iconify icon="solar:download-bold" sx={{ mr: 1 }} />
                  {downloadingPdf ? 'Generating…' : 'Download PDF'}
                </MenuItem>
              </Menu>
            </Box>
          )}
        </>
      ) : (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>{announcement.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{fDate(announcement.createdAt)}</Typography>
              </Stack>
              {hasDescription(announcement.description) && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{announcement.description}</Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                {announcement.category?.split(', ').map((category: string, index: number) => {
                  const trimmed = category.trim();
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
                    <Label key={index} variant="soft" color={getCategoryColor(trimmed)} sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>{trimmed}</Label>
                  );
                })}
              </Stack>
              {announcement.requiresSignature && (
                <Stack direction="row" sx={{ mb: 3 }}>
                  <Label color="warning" sx={isMobile ? { fontSize: '0.9375rem', height: 32 } : undefined}>Requires signature</Label>
                </Stack>
              )}
              {!announcement.requiresSignature && <Box sx={{ mb: 3 }} />}
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>Content</Typography>
              <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Markdown
                  components={{
                    img: ({ node: _n, onLoad: _o, src, alt, ...props }) => (
                      <Box
                        component="img"
                        src={src}
                        alt={alt ?? ''}
                        {...props}
                        onClick={() => src && handleImageClick(src)}
                        role={isMobile ? 'button' : undefined}
                        sx={{
                          maxWidth: '100%',
                          height: 'auto',
                          display: 'block',
                          borderRadius: 2,
                          ...(isMobile && { cursor: 'pointer' }),
                        }}
                      />
                    ),
                  }}
                >
                  {announcement.content}
                </Markdown>
              </Box>
            </Box>
            {Boolean(announcement.requiresSignature) && (
              <Box>
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
                      onClick={() => signatureDialog.onTrue()}
                      disabled={!acknowledged || signAnnouncement.isPending}
                      startIcon={<Iconify icon="solar:pen-bold" />}
                    >
                      {signAnnouncement.isPending ? 'Submitting…' : 'Sign'}
                    </Button>
                  </Card>
                )}
              </Box>
            )}
          </Stack>
        </Card>
      )}

      <TimeSheetSignatureDialog
        title="Sign this announcement. Draw your signature in the box below."
        type="announcement"
        dialog={signatureDialog}
        onSave={(signature) => {
          if (signature) handleSignatureSave(signature);
          else signatureDialog.onFalse();
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this announcement? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteAnnouncement.isPending}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteAnnouncement.isPending}>
            {deleteAnnouncement.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={imageDialogOpen}
        onClose={handleImageDialogClose}
        fullScreen={isMobile}
        maxWidth={isMobile ? false : 'lg'}
        fullWidth={!isMobile}
        PaperProps={{
          sx: isMobile
            ? { bgcolor: 'rgba(0,0,0,0.9)' }
            : {},
        }}
      >
        <DialogContent
          onClick={handleImageDialogClose}
          sx={{
            p: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <IconButton
            aria-label="Close"
            onClick={handleImageDialogClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              color: 'common.white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={28} />
          </IconButton>
          {imageDialogSrc && (
            <Box
              component="img"
              src={imageDialogSrc}
              alt=""
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

AnnouncementDetailsPage.metadata = metadata;
