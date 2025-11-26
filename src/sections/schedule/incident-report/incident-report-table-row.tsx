import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { IncidentReportForm } from './incident-report-form';
// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
  onDelete: (timeOffId: string) => void;
};

export function IncidentReportTableRow({ row, selected, onSelectRow, onView, onDelete }: Props) {
  const popover = usePopover();
  const quickEditForm = useBoolean();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete(row.id);
    handleCloseMenu();
  };

  const handleQuickEdit = useCallback(() => {
    quickEditForm.onTrue();
    popover.onClose();
  }, [quickEditForm, popover]);

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
      <TableRow hover selected={selected}>
        <TableCell>
          <Typography variant="body2">{row.jobNumber}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row.incidentType}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{dayjs(row.incidentDate).format('MMM DD, YYYY')}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{dayjs(row.reportDate).format('MMM DD, YYYY')}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row.reportedBy}</Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getSeverityColor(row.incidentSeverity)}>
            {row.incidentSeverity}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? 'inherit' : 'default'}
                onClick={handleQuickEdit}
                sx={{ mr: 1 }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

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
