
//--------------------------------------------------------------------

import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Iconify } from "src/components/iconify/iconify";

import { TextBoxContainer } from "./timesheet-textbox-container";

type ITimeSheetDetailHeaderProps = {
   job_number: number;
   company_name: string;
   full_address: string;
   client_name: string;
   worker_name: string;
   approver_name: string;
}

export function TimeSheetDetailHeader({
   job_number,
   company_name,
   full_address,
   client_name,
   worker_name,
   approver_name
}: ITimeSheetDetailHeaderProps) {

   const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

   return(
      <Stack
         divider={
            <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
            />
         }
         sx={{ p: 2, gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
      >
         <Stack sx={{ flex: 1 }}>
            <TextBoxContainer 
               title='JOB #' 
               content={job_number ? `JO-${job_number}` : ''}
               icon={<Iconify icon='solar:case-minimalistic-bold' />}
            />

            <TextBoxContainer 
               title="PO # | NW #"
               content="PO-1"
               icon={<Iconify icon='solar:bill-list-bold-duotone' />}
            />
         </Stack>


         <Stack sx={{ flex: 2 }}>
            <TextBoxContainer
               title="SITE"
               content={full_address || ''}
               icon={<Iconify icon='mingcute:location-fill' />}
            />

            <TextBoxContainer 
               title="CLIENT"
               content={client_name || 'CLIENT NAME' }
               icon={<Iconify icon='solar:user-rounded-bold' />}
            />
         </Stack>

         <Stack sx={{ flex: 1 }}>
            <TextBoxContainer 
               title="SUBMITTED BY"
               content={worker_name}
               icon={<Iconify icon='solar:users-group-rounded-bold-duotone' />}
            />
            <TextBoxContainer 
               title="APPROVED BY"
               content={approver_name}
               icon={<Iconify icon='solar:check-circle-bold' />}
            />
         </Stack>

         <Stack sx={{ flex: 1 }}>
            <TextBoxContainer 
               title="SUBMITTED BY"
               content={worker_name}
               icon={<Iconify icon='solar:user-id-bold' />}
            />
            <TextBoxContainer 
               title="APPROVED BY"
               content={approver_name}
               icon={<Iconify icon='solar:user-id-bold' />}
            />
         </Stack>
      </Stack>
   );
}