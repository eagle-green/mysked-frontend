
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";

//-----------------------------------------------------------------------
type TimesheetManagerChangeDialogProps = {
   open: boolean;
   onClose: () => void;
   onConfirm: () => void;
   currentManager: {
      id: string;
      name: string;
      photo_url?: string | null;
   };
   newManager: {
      id: string;
      name: string;
      photo_url?: string | null;
   };
};

export function TimesheetManagerChangeDialog({
   open,
   onClose,
   onConfirm,
   currentManager,
   newManager,
}: TimesheetManagerChangeDialogProps) {
   return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
         <DialogTitle>
            <Typography variant="h6" component="div">
               Transfer Timesheet Manager Role
            </Typography>
         </DialogTitle>
         
         <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
               Are you sure you want to transfer the timesheet manager role to another worker? 
               This action will:
            </DialogContentText>
            
            <Box sx={{ mb: 3 }}>
               <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  • Remove your editing access to this timesheet
               </Typography>
               <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  • Transfer all management responsibilities to the new manager
               </Typography>
               <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  • Redirect you to the timesheet list page
               </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
               <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  From:
               </Typography>
               <Avatar 
                  src={currentManager.photo_url || undefined} 
                  alt={currentManager.name}
                  sx={{ width: 32, height: 32 }}
               >
                  {currentManager.name?.charAt(0)?.toUpperCase()}
               </Avatar>
               <Typography variant="body2">
                  {currentManager.name}
               </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
               <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  To:
               </Typography>
               <Avatar 
                  src={newManager.photo_url || undefined} 
                  alt={newManager.name}
                  sx={{ width: 32, height: 32 }}
               >
                  {newManager.name?.charAt(0)?.toUpperCase()}
               </Avatar>
               <Typography variant="body2">
                  {newManager.name}
               </Typography>
            </Stack>
         </DialogContent>
         
         <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={onClose} color="inherit">
               Cancel
            </Button>
            <Button 
               onClick={onConfirm} 
               variant="contained" 
               color="primary"
               autoFocus
            >
               Confirm Transfer
            </Button>
         </DialogActions>
      </Dialog>
   );
}

