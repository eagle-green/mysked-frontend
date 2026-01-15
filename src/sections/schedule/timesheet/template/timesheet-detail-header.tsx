//--------------------------------------------------------------------

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useMediaQuery } from '@mui/material';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify/iconify';

import { TextBoxContainer } from './timesheet-textbox-container';

//-----------------------------------------------------------------------
type ITimeSheetDetailHeaderProps = {
  job_number: number | string;
  po_number?: string | null;
  network_number?: string | null;
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
  } | null;
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
  timesheet_status?: string;
  submitted_at?: string | null;
  submitted_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string | null;
  } | null;
};

export function TimeSheetDetailHeader({
  job_number,
  po_number,
  network_number,
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
  timesheet_status,
  submitted_at,
  submitted_by,
}: ITimeSheetDetailHeaderProps) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  // Helper to check if a value exists and is non-empty
  const hasValue = (val: string | null | undefined): boolean => val !== null && val !== undefined && val.trim() !== '';

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

        {hasValue(po_number) && (
          <TextBoxContainer
            title="Purchase Order"
            content={po_number!}
            icon={<Iconify icon="solar:flag-bold" />}
          />
        )}
        {hasValue(network_number) && (
          <TextBoxContainer
            title="Network Number/FSA"
            content={network_number!}
            icon={<Iconify icon="solar:flag-bold" />}
          />
        )}
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
              sx={{ width: 32, height: 32 }}
            >
              {client_name?.charAt(0)?.toUpperCase()}
            </Avatar>
          }
        />
      </Stack>

      <Stack sx={{ flex: 1 }}>
        <TextBoxContainer
          title="TIMESHEET MANAGER"
          content={
            timesheet_manager
              ? `${timesheet_manager.first_name} ${timesheet_manager.last_name}`
              : 'No Manager'
          }
          icon={
            <Avatar
              src={timesheet_manager?.photo_url || undefined}
              alt={
                timesheet_manager
                  ? `${timesheet_manager.first_name} ${timesheet_manager.last_name}`
                  : 'No Manager'
              }
              sx={{ width: 32, height: 32 }}
            >
              {timesheet_manager?.first_name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
          }
        />
        {timesheet_status === 'submitted' || timesheet_status === 'approved'
          ? submitted_at && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  mt: 1,
                  ml: 0,
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Submitted: {fDateTime(submitted_at)}
                </Typography>
                {submitted_by && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={submitted_by.photo_url || undefined}
                      alt={`${submitted_by.first_name} ${submitted_by.last_name}`}
                      sx={{ width: 20, height: 20, fontSize: '0.65rem' }}
                    >
                      {submitted_by.first_name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {submitted_by.first_name} {submitted_by.last_name}
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          : canEditTimesheetManager && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, ml: 0 }}>
                <Button
                  size="small"
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (onTimesheetManagerChange && workerOptions.length > 0) {
                      onTimesheetManagerChange();
                    }
                  }}
                  disabled={disabled}
                  sx={{
                    fontSize: { xs: '1rem', sm: '0.65rem' },
                    py: { xs: 1.5, sm: 0.25 },
                    px: { xs: 2, sm: 1 },
                    minHeight: { xs: '48px', sm: 'auto' },
                    minWidth: { xs: '100%', sm: 'auto' },
                    width: { xs: '100%', sm: 'auto' },
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
                sx={{ width: 32, height: 32 }}
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
