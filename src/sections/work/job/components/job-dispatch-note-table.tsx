import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { Scrollbar } from 'src/components/scrollbar';

import { JobDispatchNoteRow } from './job-dispatch-note-row';
import { JobDispatchNoteSummary } from './job-dispatch-note-summary';

// ----------------------------------------------------------------------

type Worker = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  position: string;
  start_time: string;
  end_time: string;
  status: string;
  is_timesheet_manager: boolean;
  vehicle?: {
    type: string;
    license_plate: string;
    unit_number: string;
  } | null;
};

type Job = {
  id: string;
  job_number: string;
  memo?: string | null;
  created_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  updated_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  customer: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  location?: string;
  lct_count: number;
  tcp_count: number;
  hwy_count: number;
  field_supervisor_count: number;
  workers: Worker[];
  region?: string;
};

type Props = {
  title: string;
  jobs: Job[];
  selectedDate: string;
  metrics?: {
    tcp_active: number;
    tcp_available: number;
    lct_active: number;
    lct_available: number;
    hwy_active: number;
    hwy_available: number;
    field_supervisor_active: number;
    field_supervisor_available: number;
  };
};

export function JobDispatchNoteTable({ title, jobs, selectedDate, metrics }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleToggleExpand = (jobId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  // Don't render anything if no jobs (handled by parent now)
  if (jobs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {jobs.length} Job{jobs.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        }
        sx={{ pb: 2 }}
        action={
          metrics && (
            <Box sx={{ minWidth: 300 }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Crew Summary
              </Typography>
              <JobDispatchNoteSummary metrics={metrics} />
            </Box>
          )
        }
      />

      <Scrollbar>
        <Table
          size="small"
          sx={{
            '& .MuiTableCell-root': {
              borderRight: '1px solid',
              borderColor: 'divider',
              fontSize: '0.8125rem',
              py: 0.75,
              px: 1,
            },
            '& .MuiTableCell-head': {
              bgcolor: 'background.neutral',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            },
            '& .MuiTableRow-root:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 300 }}>Memo</TableCell>
              <TableCell sx={{ width: 100 }}>Job #</TableCell>
              <TableCell sx={{ width: 140 }}>Created By</TableCell>
              <TableCell sx={{ width: 140 }}>Updated By</TableCell>
              <TableCell sx={{ width: 200 }}>Assigned Worker</TableCell>
              <TableCell sx={{ width: 150 }}>Customer</TableCell>
              <TableCell sx={{ width: 150 }}>Client</TableCell>
              <TableCell sx={{ width: 120 }}>Location</TableCell>
              <TableCell sx={{ width: 60, textAlign: 'center' }}>LCT</TableCell>
              <TableCell sx={{ width: 60, textAlign: 'center' }}>TCP</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
                <JobDispatchNoteRow
                  key={job.id}
                  job={job}
                  isExpanded={expandedRows.has(job.id)}
                  onToggleExpand={() => handleToggleExpand(job.id)}
                  selectedDate={selectedDate}
                />
              ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
