import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";


//-----------------------------------------------------------------------
type Props = {
   content: string;
   title?: string;
   icon: ReactNode;
};

export function TextBoxContainer({content, title, icon}: Props) {
   return (
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
         {icon}
         <Stack sx={{
               display: 'flex',
               flexDirection: 'column'
            }}
         >
            <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
               {title}
            </Typography>
            
            <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
               {content}
            </Typography>
         </Stack>
      </Box>
   )
}