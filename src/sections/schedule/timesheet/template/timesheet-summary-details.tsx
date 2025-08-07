import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

//----------------------------------------------------------------------
type TimeSummaryContainer = {
   hours: number | null;
   header: string;
   details: string;
}

export function TimeSummaryHeader({ hours, header, details}: TimeSummaryContainer) {
   return(
      <>
         <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1}}>
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
               {header}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.disabled', display: 'flex', gap: 2, alignItems: 'center' }}>
              {details}: <span style={{ color: 'text.primary'}}>{hours ? hours : 'Ongoing ...'}</span>
            </Typography>
         </Box>
      </>
   );
}