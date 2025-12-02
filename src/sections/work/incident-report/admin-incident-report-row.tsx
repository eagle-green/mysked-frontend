import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { IncidentReportForm } from 'src/sections/schedule/incident-report/incident-report-form';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
  onDelete: (timeOffId: string) => void;
};

export function AdminIncidentReportTableRow({
  row,
  selected,
  onSelectRow,
  onView,
  onDelete,
}: Props) {
  const popover = usePopover();
  const quickEditForm = useBoolean();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
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
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

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
            href={`${paths.work.job.incident_report.detail(row.id)}`}
          >
            <Iconify icon="solar:pen-bold" />
            View Detail
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
