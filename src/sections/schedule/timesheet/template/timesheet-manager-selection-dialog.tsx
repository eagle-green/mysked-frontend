
import { useState } from "react";

import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemText from "@mui/material/ListItemText";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";

import { getPositionColor } from 'src/utils/format-role';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';

//-----------------------------------------------------------------------
type TimesheetManagerSelectionDialogProps = {
   open: boolean;
   onClose: () => void;
   onConfirm: (selectedManagerId: string) => void;
   currentManager: {
      id: string;
      name: string;
      photo_url?: string | null;
   };
   workerOptions: Array<{
      value: string;
      label: string;
      photo_url?: string | null;
      first_name?: string;
      last_name?: string;
      position?: string;
   }>;
};

export function TimesheetManagerSelectionDialog({
   open,
   onClose,
   onConfirm,
   currentManager,
   workerOptions,
}: TimesheetManagerSelectionDialogProps) {
   const [selectedManagerId, setSelectedManagerId] = useState<string>('');

   const handleConfirm = () => {
      if (selectedManagerId) {
         onConfirm(selectedManagerId);
      }
   };

   const handleClose = () => {
      setSelectedManagerId('');
      onClose();
   };

   return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
         <DialogTitle>
            <Typography variant="h6" component="div">
               Select New Timesheet Manager
            </Typography>
         </DialogTitle>
         
         <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
               Choose a new timesheet manager from the available workers. 
               This will transfer all management responsibilities.
            </Typography>

            <Box sx={{ mb: 2 }}>
               <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Current Manager:
               </Typography>
               <Stack direction="row" spacing={1} alignItems="center">
                  {currentManager.name !== 'No Manager Assigned' && (
                     <Avatar 
                        src={currentManager.photo_url || undefined} 
                        alt={currentManager.name}
                        sx={{ width: 32, height: 32 }}
                     >
                        {currentManager.name?.charAt(0)?.toUpperCase()}
                     </Avatar>
                  )}
                  <Typography variant="body2">
                     {currentManager.name}
                  </Typography>
               </Stack>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
               Available Workers:
            </Typography>
            
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
               {workerOptions
                  .filter(worker => worker.value !== currentManager.id)
                  .map((worker) => {
                     const positionLabel = JOB_POSITION_OPTIONS.find(
                        (option) => option.value === worker.position
                     )?.label || worker.position || 'Worker';
                     
                     return (
                        <ListItem key={worker.value} disablePadding>
                           <ListItemButton
                              onClick={() => setSelectedManagerId(worker.value)}
                              selected={selectedManagerId === worker.value}
                              sx={{ borderRadius: 1 }}
                           >
                              <ListItemAvatar sx={{ marginRight: 1 }}>
                                 <Avatar 
                                    src={worker.photo_url || undefined} 
                                    alt={worker.label}
                                    sx={{ width: 32, height: 32 }}
                                 >
                                    {worker.label?.charAt(0)?.toUpperCase()}
                                 </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                 primary={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                       <Typography variant="body2">
                                          {worker.label}
                                       </Typography>
                                       <Label variant="soft" color={getPositionColor(worker.position)}>
                                          {positionLabel}
                                       </Label>
                                    </Stack>
                                 }
                              />
                              <Radio
                                 checked={selectedManagerId === worker.value}
                                 value={worker.value}
                              />
                           </ListItemButton>
                        </ListItem>
                     );
                  })}
            </List>
         </DialogContent>
         
         <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleClose} color="inherit">
               Cancel
            </Button>
            <Button 
               onClick={handleConfirm} 
               variant="contained" 
               color="primary"
               disabled={!selectedManagerId}
               autoFocus
            >
               Select Manager
            </Button>
         </DialogActions>
      </Dialog>
   );
}


