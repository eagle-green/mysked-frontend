import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate, fTime, fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  onDelete: (id: string) => void;
};

export function AdminIncidentReportMobileCard({ row, onDelete }: Props) {
  const menuActions = usePopover();
  const showDetails = useBoolean();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(row.id);
    menuActions.onClose();
  };

  const getSeverityColor = (status: string) => {
    switch (status) {
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
      <Card
        component={RouterLink}
        href={paths.work.incident_report.detail(row.id)}
        sx={{
          p: 2,
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 0.5, fontWeight: 700 }}>
                Incident ID: {row.displayId || row.display_id || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 400 }}>
                #{row.jobNumber?.toUpperCase() ?? '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Label variant="soft" color={getStatusColor(row.status)}>
                {getStatusLabel(row.status)}
              </Label>
              <IconButton
                size="small"
                color={menuActions.open ? 'inherit' : 'default'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  menuActions.onOpen(e);
                }}
              >
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Date
            </Typography>
            <Typography variant="body2">
              {row.job?.start_time ? fDate(row.job.start_time, 'MMM DD YYYY') : '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Incident Type
            </Typography>
            <Typography variant="body2">{capitalizeIncidentType(row.incidentType)}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Severity
            </Typography>
            <Label variant="soft" color={getSeverityColor(row.incidentSeverity)}>
              {row.incidentSeverity}
            </Label>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Detail
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showDetails.onToggle();
              }}
              sx={{
                width: 28,
                height: 28,
                p: 0,
                transform: showDetails.value ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
            </IconButton>
          </Box>

          <Collapse in={showDetails.value}>
            <Box
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Customer
                  </Typography>
                  <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={row?.company?.logo_url ?? undefined}
                      alt={row?.company?.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {row?.company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
                    </Avatar>
                    <Typography variant="body2" noWrap>
                      {row?.company?.name || '-'}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Site
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                    <Typography variant="body2" noWrap sx={{ width: '100%' }}>
                      {row.site?.name ?? '-'}
                    </Typography>
                    {row.site?.display_address && (
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {row.site.display_address}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Client
                  </Typography>
                  <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={row?.client?.logo_url ?? undefined}
                      alt={row?.client?.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {row?.client?.name?.charAt(0)?.toUpperCase() ?? 'C'}
                    </Avatar>
                    <Typography variant="body2" noWrap>
                      {row?.client?.name ?? '-'}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Incident Time
                  </Typography>
                  <ListItemText
                    primary={row.incidentDate ? fDate(row.incidentDate, 'MMM DD YYYY') : '-'}
                    secondary={row.incidentTime ? fTime(row.incidentTime) : null}
                    slotProps={{
                      primary: { noWrap: true, sx: { typography: 'body2' } },
                      secondary: { sx: { mt: 0.5, typography: 'caption' } },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Reported By
                  </Typography>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={row?.reportedByUser?.photo_url ?? undefined}
                        alt={row?.reportedByUser?.name}
                        sx={{ width: 32, height: 32 }}
                      >
                        {(row?.reportedByUser?.name || row?.reportedBy)?.charAt(0)?.toUpperCase() ?? 'U'}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {row.reportedBy ?? '-'}
                      </Typography>
                    </Stack>
                    {row.reportDate && (
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(row.reportDate)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </Stack>
      </Card>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem component={RouterLink} href={paths.work.incident_report.detail(row.id)}>
            <Iconify icon="solar:eye-bold" />
            View
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
