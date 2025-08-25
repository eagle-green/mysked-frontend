import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";


//-----------------------------------------------------------------------
type Props = {
   content: string | ReactNode;
   title?: string;
   icon: ReactNode;
};

export function TextBoxContainer({content, title, icon}: Props) {
   return (
      <Box sx={{ 
         mb: 1, 
         display: 'flex', 
         flexDirection: 'column',
         gap: 1
      }}>
         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {title}
         </Typography>
         
         <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5
         }}>
            {icon}
            {typeof content === 'string' ? (
               <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                  {content}
               </Typography>
            ) : (
               <Box sx={{ flex: 1 }}>
                  {content}
               </Box>
            )}
         </Box>
      </Box>
   )
}
