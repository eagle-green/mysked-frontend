import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate, fTime, fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
  onDelete: (incidentReportId: string) => void;
};

export function AdminIncidentReportTableRow({
  row,
  selected,
  onSelectRow,
  onView,
  onDelete,
}: Props) {
  const popover = usePopover();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'high':
      case 'severe':
        return 'error';
      default:
        return 'default';
    }
  };

  const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Resolved', value: 'resolved' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_review':
        return 'error';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (statusValue: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option ? option.label : statusValue;
  };

  const capitalizeIncidentType = (type: string) => {
    if (!type) return type;
    return type
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <>
      <TableRow hover selected={selected}>
        {/* ID */}
        <TableCell>
          <Link
            component={RouterLink}
            href={`${paths.work.incident_report.detail(row.id)}`}
            variant="subtitle2"
            sx={{
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {row.displayId || row.display_id || 'N/A'}
          </Link>
        </TableCell>

        {/* Job Number */}
        <TableCell>
          {row.jobNumber ? (
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              #{row.jobNumber.toUpperCase()}
            </Typography>
          ) : null}
        </TableCell>

        {/* Job Date */}
        <TableCell>
          {row.job?.start_time ? (
            <Typography variant="body2">
              {fDate(row.job.start_time, 'MMM DD YYYY')}
            </Typography>
          ) : null}
        </TableCell>

        {/* Incident Type */}
        <TableCell>
          <Typography variant="body2">{capitalizeIncidentType(row.incidentType)}</Typography>
        </TableCell>

        {/* Severity */}
        <TableCell>
          <Label variant="soft" color={getSeverityColor(row.incidentSeverity)}>
            {row.incidentSeverity}
          </Label>
        </TableCell>

        {/* Customer */}
        <TableCell>
          {row?.company?.name ? (
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={row?.company?.logo_url ?? undefined}
                alt={row?.company?.name}
                sx={{ width: 32, height: 32 }}
              >
                {row?.company?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row?.company?.name}
              </Typography>
            </Box>
          ) : null}
        </TableCell>

        {/* Site */}
        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" noWrap>
              {row.site.name}
            </Typography>
            {row.site.display_address && (
              <Box
                component="span"
                sx={{
                  color: 'text.disabled',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {(() => {
                  const hasCompleteAddress =
                    !!row.site.street_number &&
                    !!row.site.street_name &&
                    !!row.site.city &&
                    !!row.site.province &&
                    !!row.site.postal_code &&
                    !!row.site.country;

                  if (hasCompleteAddress) {
                    return (
                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            row.site.unit_number,
                            row.site.street_number,
                            row.site.street_name,
                            row.site.city,
                            row.site.province,
                            row.site.postal_code,
                            row.site.country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {row.site.display_address}
                      </Link>
                    );
                  }
                  return <span>{row.site.display_address}</span>;
                })()}
              </Box>
            )}
          </Box>
        </TableCell>

        {/* Client */}
        <TableCell>
          {row?.client?.name ? (
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={row?.client.logo_url ?? undefined}
                alt={row?.client.name}
                sx={{ width: 32, height: 32 }}
              >
                {row?.client.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row?.client.name}
              </Typography>
            </Box>
          ) : null}
        </TableCell>

        {/* Incident Time */}
        <TableCell>
          <ListItemText
            primary={fDate(row.incidentDate, 'MMM DD YYYY')}
            secondary={fTime(row.incidentTime)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        {/* Reported By */}
        <TableCell>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                src={row?.reportedByUser?.photo_url ?? undefined}
                alt={row?.reportedByUser?.name}
                sx={{ width: 32, height: 32 }}
              >
                {row?.reportedByUser?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row.reportedBy}
              </Typography>
            </Stack>
            {row.reportDate && (
              <Typography variant="caption" color="text.secondary">
                {fDateTime(row.reportDate)}
              </Typography>
            )}
          </Stack>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {getStatusLabel(row.status)}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            component={RouterLink}
            href={`${paths.work.incident_report.detail(row.id)}`}
          >
            <Iconify icon="solar:pen-bold" />
            View Detail
          </MenuItem>
          {row.status === 'pending' && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onDelete(row.id);
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}
