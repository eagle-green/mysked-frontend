import { useCallback, useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks/use-router';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { IncidentReportForm } from './incident-report-form';

//--------------------------------------------------------------------------------

type Props = {
  row: any;
  onDelete: (id: string) => void;
  onQuickEdit: (timeOff: any) => void;
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
      case 'severe':
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
              <Typography variant="subtitle2" color="primary">
                Traffic Accident
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Label variant="soft" color={getSeverityColor('minor')}>
                Minor
              </Label>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Quick Edit" placement="top" arrow>
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
                </Tooltip>

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

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Report Date
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              06 Nov 2025
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Incident Date
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              06 Nov 2025
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Description
            </Typography>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              No description provided
            </Typography>
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
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <IncidentReportForm
        jobId={row.id}
        open={quickEditForm.value}
        onClose={quickEditForm.onFalse}
        onUpdateSuccess={quickEditForm.onFalse}
      />
    </>
  );
}
