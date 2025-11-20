import dayjs from 'dayjs';
import { useState } from 'react';

import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
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

  return (
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
        <Typography variant="body2">{row.reportDescription}</Typography>
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
        <Typography variant="body2">{row.incidentSeverity}</Typography>
      </TableCell>
    </TableRow>
  );
}
