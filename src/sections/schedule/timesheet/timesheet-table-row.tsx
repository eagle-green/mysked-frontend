import type { ITimeSheetTableView, TimecardEntry } from "src/types/timecard";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemText from "@mui/material/ListItemText";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";

import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from "src/utils/format-time";
import { formatDuration, getFullAddress } from "src/utils/timecard-helpers";

import { endpoints, fetcher } from "src/lib/axios";

import { Label } from "src/components/label";
import { Iconify } from "src/components/iconify";
import { CustomPopover } from "src/components/custom-popover/custom-popover";

import { TimeSheet } from "src/types/timesheet";
import { TimeSheetStatus } from "src/types/timecard";


// ----------------------------------------------------------------------

type Props = {
  row: TimeSheet;
  selected: boolean;
  recordingLink: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function TimeSheetTableRow(props: Props) {
   const { row, selected, recordingLink, onSelectRow, onDeleteRow } = props
   const menuActions = usePopover();
   const confirmDialog = useBoolean();
   // const collapseRow = useBoolean();
   const [isDeleting, setIsDeleting] = useState(false);
   const [duration, setDuration] = useState<number>(0);
   const { job, client, site } = row;

   useEffect(() => {
      if (job.start_time && job.end_time) {
         const start = dayjs(job.start_time);
         const end = dayjs(job.end_time);
         const hours = end.diff(start, 'minute') / 60;
         setDuration(hours);
      } else {
         setDuration(0);
      }
   }, [job.start_time, job.end_time]);

   if (!row) return null;

   const handleDelete = async () => {
      setIsDeleting(true);
      try {
         await onDeleteRow();
      } finally {
         setIsDeleting(false);
         confirmDialog.onFalse();
      }
   };

   const renderConfirmDialog = () => (
      <Dialog fullWidth maxWidth="xs" open={confirmDialog.value} onClose={confirmDialog.onFalse}>
         <DialogTitle sx={{ pb: 2 }}>Delete</DialogTitle>

         <DialogContent sx={{ typography: 'body2' }}>
            Are you sure want to delete timesheet with Job #{' '}
            <strong> {job.job_number} </strong>
            ?
         </DialogContent>

         <DialogActions>
            <Button
               variant="outlined"
               color="inherit"
               onClick={confirmDialog.onFalse}
               disabled={isDeleting}
            >
               Cancel
            </Button>
            <Button
               variant="contained"
               color="error"
               onClick={handleDelete}
               disabled={isDeleting}
               startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
            >
               {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
         </DialogActions>
      </Dialog>
   );

   const renderMenuActions = () => (
      <CustomPopover
         open={menuActions.open}
         anchorEl={menuActions.anchorEl}
         onClose={menuActions.onClose}
         slotProps={{ arrow: { placement: 'right-top' } }}
         >
         <MenuList>
            <li>
               <MenuItem onClick={() => menuActions.onClose()}>
                  <Iconify icon="solar:pen-bold" />
                  Edit
               </MenuItem>
            </li>

            <li>
               <MenuItem
                  onClick={() => {
                     confirmDialog.onTrue();
                     menuActions.onClose();
                  }}
                  sx={{ color: 'error.main' }}
               >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                  Delete
               </MenuItem>
            </li>
         </MenuList>
      </CustomPopover>
   );

   function renderPrimaryRow() {
      return(
         <TableRow 
            hover
            selected={selected}
            aria-checked={selected}
            tabIndex={-1}
         >
            <TableCell padding="checkbox">
               <Checkbox
               checked={selected}
               onClick={onSelectRow}
               slotProps={{
                  input: {
                     id: `${row.id}-checkbox`,
                     'aria-label': `${row.id} checkbox`,
                  },
               }}
               />
            </TableCell>
            
            <TableCell>
               <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                  <Link
                     component={RouterLink}
                     href={recordingLink}
                     color="inherit"
                     sx={{ cursor: 'pointer' }}
                  >
                   JO-{job.job_number}
                  </Link>
               </Stack>
            </TableCell>
            <TableCell>
               <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                  {site.name}
                  {/* For confirmation if we can add the company details or location details */}
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                     {(() => {
                        const hasCompleteAddress =
                           !!site.street_number &&
                           !!site.street_name &&
                           !!site.city &&
                           !!site.province &&
                           !!site.postal_code &&
                           !!site.country;

                        if (hasCompleteAddress) {
                           return (
                           <Link
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                 [
                                 site.unit_number,
                                 site.street_number,
                                 site.street_name,
                                 site.city,
                                 site.province,
                                 site.postal_code,
                                 site.country,
                                 ]
                                 .filter(Boolean)
                                 .join(', ')
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              sx={{ fontSize: '.8rem'}}
                           >
                              {getFullAddress(site)}
                           </Link>
                           );
                        }
                        // Show as plain text if not a complete address
                        return <span>{getFullAddress(row.company)}</span>;
                     })()}
                  </Box>
               </Stack>
            </TableCell>
            {/* <TableCell>{job.company.region}</TableCell> */}
            <TableCell>
               <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                  {/* For confirmation if we can include the client logo */}
                  <Avatar
                  src={client.logo_url as string}
                  alt={client.name}
                  sx={{ width: 28, height: 28 }}
                  >
                  {client.name}
                  </Avatar>

                  <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                  {client.name}
                  </Stack>
               </Box>
            </TableCell>
            <TableCell>
               <ListItemText
               primary={fDate(job.start_time)}
               secondary={fTime(job.start_time)}
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
   
            <TableCell>
               <ListItemText
               primary={fDate(job.end_time)}
               secondary={fTime(job.end_time)}
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

            <TableCell>
               <ListItemText
                  primary={formatDuration(duration as number)}
                  secondary={`Hour${duration > 0 ? 's': ''}`}
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

            <TableCell>
               <Label
                  variant="soft"
                  color={
                     (row?.status === TimeSheetStatus.DRAFT && 'secondary') ||
                     (row?.status === TimeSheetStatus.SUBMITTED && 'info') ||
                     (row?.status === TimeSheetStatus.APPROVED && 'success') ||
                     (row?.status === TimeSheetStatus.REJECTED && 'error') ||
                     'default'
                  }
                  >
                  {row?.status}
               </Label>
            </TableCell>

            <TableCell>
               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                     color={menuActions.open ? 'inherit' : 'default'}
                     onClick={menuActions.onOpen}
                  >
                     <Iconify icon="eva:more-vertical-fill" />
                  </IconButton>
               </Box>
            </TableCell>
         </TableRow>
      );
   }

     return (
       <>
         {renderPrimaryRow()}
         {renderMenuActions()}
         {renderConfirmDialog()}
       </>
     );
}
