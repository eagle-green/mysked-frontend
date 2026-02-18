import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { getCategoryColor } from 'src/utils/category-colors';
import { fDate, fTime, fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

/** Treat empty or placeholder "sub title optional" as no description. */
function hasDescription(description: string | null | undefined): boolean {
  const t = description?.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower === 'sub title optional' || lower === 'sub title (optional)') return false;
  return true;
}

type Props = {
  row: any;
  indexNumber: number;
  selected: boolean;
  onSelectRow: (checked: boolean) => void;
  onView: (announcement: any) => void;
  onDelete: (id: string) => void;
  canDelete?: boolean;
  /** When true (e.g. company path), always show Opened at and Signature columns (use — when no status) */
  showRecipientColumns?: boolean;
  /** When provided (e.g. company path), used for the title link; else management details */
  getDetailsHref?: (id: string) => string;
};

export function AnnouncementTableRow({ row, indexNumber, selected, onSelectRow, onView, onDelete, canDelete, showRecipientColumns, getDetailsHref }: Props) {
  const theme = useTheme();
  const detailsHref = (getDetailsHref ?? paths.management.announcements.details)(row.id);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete(row.id);
    handleCloseMenu();
  };

  return (
    <TableRow hover>
      <TableCell align="center" sx={{ width: 64 }}>
        <Typography variant="body2" color="text.secondary">
          {row.displayId ?? indexNumber}
        </Typography>
      </TableCell>
      <TableCell sx={{ maxWidth: { xs: 200, sm: 300, md: 400 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Link
              component={RouterLink}
              href={detailsHref}
              color="inherit"
              sx={{ textDecoration: 'none' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.title}
              </Typography>
            </Link>
            {hasDescription(row.description) && (
              <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.description}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: { xs: 150, sm: 200 } }}>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {(row.category?.split(', ').map((c: string) => c.trim()).filter(Boolean) ?? []).map((trimmed: string, index: number) => {
            const hex = row.categoryColors?.[trimmed];
            return (
              <Label
                key={index}
                variant="soft"
                color={hex ? undefined : getCategoryColor(trimmed)}
                sx={
                  hex
                    ? { fontSize: '0.75rem', bgcolor: hex, color: theme.palette.getContrastText(hex) }
                    : { fontSize: '0.75rem' }
                }
              >
                {trimmed}
              </Label>
            );
          })}
        </Stack>
      </TableCell>
      <TableCell sx={{ width: 180, maxWidth: 180 }}>
        {row.recipientStatus !== undefined ? (
          row.createdAt ? (
            <Typography variant="body2" color="text.secondary">
              {fDate(row.createdAt, 'MMM DD YYYY')} {fTime(row.createdAt)}
            </Typography>
          ) : null
        ) : row.author ? (
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={row.author.avatarUrl ?? undefined}
                  alt={row.author.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.author.name?.trim().charAt(0)?.toUpperCase() || '?'}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {row.author.name || 'Unknown'}
                </Typography>
              </Stack>
            }
            secondary={row.createdAt ? `${fDate(row.createdAt, 'MMM DD YYYY')} ${fTime(row.createdAt)}` : undefined}
            slotProps={{
              primary: { sx: { typography: 'body2' } },
              secondary: { sx: { mt: 0.5, typography: 'caption' } },
            }}
          />
        ) : null}
      </TableCell>
      {canDelete && (
        <>
          <TableCell align="center" sx={{ width: 100 }}>
            {row.lastStatusChange && (row.status === 'rejected' || row.status === 'approved' || row.status === 'sent') ? (
              <Tooltip
                title={
                  <Stack spacing={1} sx={{ py: 0.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={row.lastStatusChange.changedBy?.avatarUrl}
                        sx={{ width: 24, height: 24 }}
                      >
                        {row.lastStatusChange.changedBy?.name?.charAt(0) || '?'}
                      </Avatar>
                      <Typography variant="body2" component="span">
                        {row.lastStatusChange.changedBy?.name || 'Unknown'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" component="span" display="block">
                      {row.lastStatusChange.createdAt ? fDateTime(row.lastStatusChange.createdAt) : ''}
                    </Typography>
                    {row.status === 'rejected' && row.lastStatusChange.reason && (
                      <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5, fontStyle: 'italic', maxWidth: 280 }}>
                        Reason: {row.lastStatusChange.reason}
                      </Typography>
                    )}
                  </Stack>
                }
                placement="top"
              >
                <Box component="span" sx={{ display: 'inline-block' }}>
                  <Label
                    variant="soft"
                    color={
                      row.status === 'sent' ? 'success' :
                      row.status === 'approved' ? 'success' :
                      row.status === 'rejected' ? 'error' :
                      'info'
                    }
                  >
                    {row.status || 'draft'}
                  </Label>
                </Box>
              </Tooltip>
            ) : (
              <Label
                variant="soft"
                color={
                  row.status === 'sent' ? 'success' :
                  row.status === 'approved' ? 'success' :
                  row.status === 'rejected' ? 'error' :
                  'info'
                }
              >
                {row.status || 'draft'}
              </Label>
            )}
          </TableCell>
          <TableCell align="center" sx={{ width: 100 }}>
            {row.recipientStats ? (
              <Stack direction="column" alignItems="center" spacing={0.25}>
                <Typography variant="body2" color="text.secondary">
                  {row.recipientStats.readCount}/{row.recipientStats.total} read
                </Typography>
                {row.requiresSignature && (
                  <Typography variant="caption" color="text.secondary">
                    {row.recipientStats.signedCount}/{row.recipientStats.total} signed
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.disabled">—</Typography>
            )}
          </TableCell>
        </>
      )}
      {showRecipientColumns && (
        <>
          <TableCell sx={{ width: 140 }}>
            {row.recipientStatus?.readAt ? (
              <Typography variant="body2" color="text.secondary">
                {fDate(row.recipientStatus.readAt, 'MMM DD YYYY')} {fTime(row.recipientStatus.readAt)}
              </Typography>
            ) : null}
          </TableCell>
          <TableCell sx={{ width: 120 }}>
            {row.requiresSignature ? (
              row.recipientStatus?.signedAt ? (
                <Typography variant="body2" color="success.main">
                  {fDate(row.recipientStatus.signedAt, 'MMM DD YYYY')} {fTime(row.recipientStatus.signedAt)}
                </Typography>
              ) : (
                <Label variant="soft" color="warning">Required</Label>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">Signature not required</Typography>
            )}
          </TableCell>
        </>
      )}
      {canDelete && (
        <TableCell align="right" sx={{ width: 48 }}>
          <IconButton size="small" onClick={handleOpenMenu} aria-label="more options">
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </TableCell>
      )}
    </TableRow>
  );
}
