import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useAnnouncementCategories } from 'src/hooks/use-announcement-categories';

import { getCategoryColor } from 'src/utils/category-colors';

import { fetcher } from 'src/lib/axios';
import { AnnouncementRecipientPdf } from 'src/pages/template/announcement-recipient-pdf';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useTable, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  userId: string;
};

type AnnouncementHistoryItem = {
  announcementId: string;
  displayId: number;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  categoryColors?: Record<string, string> | null;
  requiresSignature: boolean;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
  signedAt: string | null;
  signatureData: unknown;
};

/** Resolve category hex from announcement categoryColors or from API categories by name. */
function getCategoryHex(
  announcement: { categoryColors?: Record<string, string> | null },
  categoryName: string,
  apiCategories?: { name: string; color: string | null }[]
): string | undefined {
  const trimmed = categoryName.trim();
  let map = announcement.categoryColors ?? null;
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

export function AccountAnnouncementHistoryTab({ userId }: Props) {
  const theme = useTheme();
  const table = useTable({ defaultRowsPerPage: 10 });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<AnnouncementHistoryItem | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { categories: apiCategories } = useAnnouncementCategories();

  const { data, isLoading } = useQuery({
    queryKey: ['worker-announcement-history', userId],
    queryFn: async () => {
      const response = await fetcher(`/api/users/${userId}/announcement-history`);
      return (response.data?.announcements || []) as AnnouncementHistoryItem[];
    },
    enabled: !!userId,
  });

  const announcements = data || [];

  // Pagination
  const paginatedAnnouncements = announcements.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: AnnouncementHistoryItem) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRow(null);
  };

  const handleDownloadPdf = async () => {
    if (!selectedRow) return;
    setDownloadingPdf(true);
    handleMenuClose();

    try {
      const sigData = selectedRow.signatureData as { signature?: string } | null;
      const signatureUrl = sigData?.signature ?? null;

      // Get user info for the PDF
      const userResponse = await fetcher(`/api/users/${userId}`);
      const user = userResponse.data?.user;

      const blob = await pdf(
        <AnnouncementRecipientPdf
          title={selectedRow.title}
          description={selectedRow.description ?? ''}
          content={selectedRow.content}
          createdAt={selectedRow.createdAt}
          recipientName={user ? `${user.first_name} ${user.last_name}` : 'Unknown'}
          recipientEmail={user?.email || null}
          readAt={selectedRow.readAt}
          requiresSignature={selectedRow.requiresSignature}
          signedAt={selectedRow.signedAt}
          signatureDataUrl={signatureUrl}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = selectedRow.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 50);
      const safeName = user ? `${user.first_name}_${user.last_name}`.replace(/[^a-z0-9-_]/gi, '_') : 'user';
      link.download = `Announcement_${safeTitle}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded.');
    } catch (e) {
      console.error('PDF generation error:', e);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Opened</TableCell>
                <TableCell>Signed at</TableCell>
                <TableCell>Signature</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAnnouncements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyContent
                      title="No announcements"
                      description="This employee has not received any announcements yet."
                      sx={{ py: 10 }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAnnouncements.map((row) => {
                  const sigData = row.signatureData as { signature?: string } | null;
                  const signatureImageUrl = sigData?.signature ?? null;

                  return (
                    <TableRow key={row.announcementId} hover>
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          window.open(paths.management.announcements.details(row.announcementId), '_blank');
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          #{row.displayId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.title}
                        </Typography>
                        {row.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {row.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.category ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {row.category.split(', ').map((cat, idx) => {
                              const trimmed = cat.trim();
                              const hex = getCategoryHex(row, trimmed, apiCategories);
                              if (hex && /^#[0-9A-Fa-f]{3,8}$/.test(hex)) {
                                let textColor = '#000';
                                try {
                                  textColor = theme.palette.getContrastText(hex);
                                } catch {
                                  textColor = parseInt(hex.slice(1), 16) > 0xffffff / 2 ? '#000' : '#fff';
                                }
                                return (
                                  <Box
                                    key={idx}
                                    component="span"
                                    sx={{
                                      px: 0.75,
                                      height: 20,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      fontSize: '0.7rem',
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
                                <Label
                                  key={idx}
                                  variant="soft"
                                  color={getCategoryColor(trimmed)}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                >
                                  {trimmed}
                                </Label>
                              );
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.readAt ? new Date(row.readAt).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.requiresSignature ? (
                          <Typography variant="body2">
                            {row.signedAt ? new Date(row.signedAt).toLocaleString() : '—'}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Signature not required
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.requiresSignature ? (
                          signatureImageUrl ? (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 0.5,
                                bgcolor: 'background.paper',
                              }}
                            >
                              <Box
                                component="img"
                                src={signatureImageUrl}
                                alt="Signature"
                                sx={{ maxHeight: 48, maxWidth: 180, display: 'block' }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Signature not required
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row)}
                          aria-label="Actions"
                        >
                          <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {announcements.length > 0 && (
          <TablePaginationCustom
            page={table.page}
            count={announcements.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        )}
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleDownloadPdf} disabled={downloadingPdf}>
          <Iconify icon="solar:download-bold" sx={{ mr: 1 }} />
          {downloadingPdf ? 'Downloading...' : 'Download PDF'}
        </MenuItem>
      </Menu>
    </>
  );
}
