import React from 'react';
import { TableRow, TableCell, Stack, Avatar, ListItemText, IconButton, Chip, Checkbox } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Timesheet, statusColors } from './types';

interface TimesheetTableRowProps {
  row: Timesheet;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  selected: boolean;
  onSelectRow: (id: string, checked: boolean) => void;
}

export function TimesheetTableRow({ 
  row, 
  onOpenMenu, 
  selected, 
  onSelectRow 
}: TimesheetTableRowProps) {
  return (
    <TableRow>
      {/* Added checkbox column */}
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onChange={(event) => onSelectRow(row.id, event.target.checked)}
        />
      </TableCell>
      
      <TableCell>{row.id}</TableCell>
      <TableCell>{row.clientName}</TableCell>
      <TableCell>
        <ListItemText
          primary={new Date(row.startTime).toLocaleDateString()}
          secondary={`${new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src={row.submittedBy.avatar} />
          <ListItemText primary={row.submittedBy.name} secondary={row.submittedBy.role} />
        </Stack>
      </TableCell>
      <TableCell>{row.approvedBy}</TableCell>
      <TableCell>
        <Chip
          label={row.status}
          size="small"
          sx={{
            background: statusColors[row.status].background,
            color: statusColors[row.status].color,
            fontWeight: 600,
          }}
        />
      </TableCell>
      <TableCell align="center">
        <IconButton onClick={(e) => onOpenMenu(e, row.id)}>
          <MoreVertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}