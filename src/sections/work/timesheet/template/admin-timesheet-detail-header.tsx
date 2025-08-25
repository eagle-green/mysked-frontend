//--------------------------------------------------------------------

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useMediaQuery } from '@mui/material';

import { Iconify } from 'src/components/iconify/iconify';

import { TextBoxContainer } from './admin-timesheet-textbox-container';

//-----------------------------------------------------------------------
type ITimeSheetDetailHeaderProps = {
  job_number: number;
  po_number?: string | null;
  full_address: string;
  client_name: string;
  client_logo_url?: string | null;
  worker_name: string;
  worker_photo_url?: string | null;
  // Updated approver props to show actual admin who approved
  confirmed_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  // New props for timesheet manager management
  timesheet_manager_id: string;
  timesheet_manager: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  };
  current_user_id: string;
  job_id: string;
  onTimesheetManagerChange?: () => void;
  canEditTimesheetManager?: boolean;
  workerOptions?: Array<{
    value: string;
    label: string;
    photo_url: string;
    first_name: string;
    last_name: string;
  }>;
  disabled?: boolean;
};

export function TimeSheetDetailHeader({
  job_number,
  po_number,
  full_address,
  client_name,
  client_logo_url,
  worker_name,
  worker_photo_url,
  confirmed_by,
  timesheet_manager_id,
  timesheet_manager,
  current_user_id,
  job_id,
  onTimesheetManagerChange,
  canEditTimesheetManager = false,
  workerOptions = [],
  disabled = false,
}: ITimeSheetDetailHeaderProps) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return (
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
          title="JOB #"
          content={job_number}
          icon={<Iconify icon="solar:case-minimalistic-bold" />}
        />

        <TextBoxContainer
          title="PO # | NW #"
          content={po_number || ''}
          icon={<Box sx={{ width: 35, height: 35 }} />}
        />
      </Stack>

      <Stack sx={{ flex: 2 }}>
        <TextBoxContainer
          title="SITE"
          content={full_address || ''}
          icon={<Iconify icon="mingcute:location-fill" />}
        />

        <TextBoxContainer
          title="CLIENT"
          content={client_name || 'CLIENT NAME'}
          icon={
            <Avatar
              src={client_logo_url || undefined}
              alt={client_name}
              sx={{ width: 35, height: 35 }}
            >
              {client_name?.charAt(0)?.toUpperCase()}
            </Avatar>
          }
        />
      </Stack>

      <Stack sx={{ flex: 1 }}>
        <TextBoxContainer
          title="TIMESHEET MANAGER"
          content={`${timesheet_manager.first_name} ${timesheet_manager.last_name}`}
          icon={
            <Avatar
              src={timesheet_manager.photo_url || undefined}
              alt={`${timesheet_manager.first_name} ${timesheet_manager.last_name}`}
              sx={{ width: 35, height: 35 }}
            >
              {timesheet_manager.first_name?.charAt(0)?.toUpperCase()}
            </Avatar>
          }
        />
        {canEditTimesheetManager && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, ml: 0 }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (onTimesheetManagerChange && workerOptions.length > 0) {
                  onTimesheetManagerChange();
                }
              }}
              disabled={disabled}
              sx={{
                fontSize: '0.65rem',
                py: 0.25,
                px: 1,
                minHeight: 'auto',
                minWidth: 'auto',
                lineHeight: 1.2,
              }}
            >
              Change Manager
            </Button>
          </Box>
        )}
      </Stack>

      {confirmed_by && (
        <Stack sx={{ flex: 1 }}>
          <TextBoxContainer
            title="CONFIRMED BY"
            content={`${confirmed_by.first_name} ${confirmed_by.last_name}`}
            icon={
              <Avatar
                src={undefined}
                alt={`${confirmed_by.first_name} ${confirmed_by.last_name}`}
                sx={{ width: 35, height: 35 }}
              >
                {confirmed_by.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
