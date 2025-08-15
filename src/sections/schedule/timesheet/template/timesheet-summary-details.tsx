import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

//----------------------------------------------------------------------
type TimeSummaryContainer = {
   hours: number | null;
   header: string;
   details: string;
   break_hours?: number;
}  

export function TimeSummaryHeader({ hours, header, details, break_hours = 0}: TimeSummaryContainer) {
   return(
      <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1}}>
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
               {header}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.disabled', display: 'flex', gap: 2, alignItems: 'center' }}>
              {details}: <span style={{ color: 'text.primary'}}>{hours ?? 0}</span>
            </Typography>
            {!!break_hours && (
            <Typography variant="body1" sx={{ color: 'text.disabled', display: 'flex', gap: 2, alignItems: 'center' }}>
              Total Shift Duration in minutes: <span style={{ color: 'text.primary'}}>{break_hours ?? 0}</span>
            </Typography>
            )}
         </Box>
   );
}