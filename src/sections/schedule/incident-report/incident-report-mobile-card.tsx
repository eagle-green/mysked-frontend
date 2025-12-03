import { useCallback, useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { IncidentReportForm } from './incident-report-form';
//--------------------------------------------------------------------------------

type Props = {
  row: any;
  onDelete: (id: string) => void;
  onQuickEdit: (data: any) => void;
};

export function IncidentReportMobileCard({ row, onDelete, onQuickEdit }: Props) {
  const router = useRouter();
  const menuActions = usePopover();
  const quickEditForm = useBoolean();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete(row.id);
    handleCloseMenu();
  };

  const handleQuickEdit = useCallback(() => {
    onQuickEdit(row);
    quickEditForm.onTrue();
    menuActions.onClose();
  }, [quickEditForm, menuActions]);

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'minor':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'submitted':
        return 'primary';
      case 'processed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card
        sx={{
          p: 2,
          cursor: 'default',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Link
                component={RouterLink}
                href={`${paths.schedule.work.incident_report.edit(row.id)}`}
                variant="subtitle2"
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                #{row.jobNumber?.toUpperCase()}
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Label variant="soft" color={getStatusColor(row.status)}>
                {row.status}
              </Label>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                {/* <Tooltip title="Quick Edit" placement="top" arrow>
                  <IconButton
                    size="small"
                    color="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickEdit();
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip> */}

                <IconButton
                  size="small"
                  color={menuActions.open ? 'inherit' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    menuActions.onOpen(e);
                  }}
                >
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Date Time
              </Typography>
              <ListItemText
                primary={fDate(row.incidentDate)}
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
            </Box>
            <Box>
              <Label variant="soft" color={getSeverityColor(row.incidentSeverity)}>
                {row.incidentSeverity}
              </Label>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Incident Type
            </Typography>
            <Typography variant="subtitle2">{row.incidentType?.toUpperCase()}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Site
            </Typography>
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
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Client
            </Typography>
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
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Requested By: Jerwin Fortillano
            </Typography>
          </Box>
        </Stack>
      </Card>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            component={RouterLink}
            href={`${paths.schedule.work.incident_report.edit(row.id)}`}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* <IncidentReportForm
        data={row}
        open={quickEditForm.value}
        onClose={quickEditForm.onFalse}
        onUpdateSuccess={quickEditForm.onFalse}
      /> */}
    </>
  );
}
