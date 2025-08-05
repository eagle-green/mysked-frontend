// types.ts
import { Theme } from '@mui/material/styles';

export type StatusType = 'Submitted' | 'Approved' | 'Rejected' | 'Draft';

export interface SubmittedBy {
  name: string;
  avatar: string;
  role: string;
}

export interface Timesheet {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: StatusType;
  submittedBy: SubmittedBy;
  approvedBy: string;
}

export const statusColors: Record<StatusType, { color: string; background: string }> = {
  Submitted: { color: '#0F172A', background: '#A5F3FC' },
  Approved: { color: '#065F46', background: '#BBF7D0' },
  Rejected: { color: '#991B1B', background: '#FECACA' },
  Draft: { color: '#6B21A8', background: '#E9D5FF' },
};

// types.ts
export const MOCK_TIMESHEETS: Timesheet[] = [
  {
    id: 'JO-101',
    clientName: 'BrightSoft Technologies',
    startTime: '2025-07-15T09:00:00',
    endTime: '2025-07-15T17:00:00',
    status: 'Submitted',
    submittedBy: { 
      name: 'Hassan Iqbal', 
      avatar: '', 
      role: 'Engineer' 
    },
    approvedBy: 'Usman Tariq',
  },
  {
    id: 'JO-102',
    clientName: 'Vertex Builders',
    startTime: '2025-07-14T08:30:00',
    endTime: '2025-07-14T16:30:00',
    status: 'Approved',
    submittedBy: { 
      name: 'Fatima Noor', 
      avatar: '', 
      role: 'Supervisor' 
    },
    approvedBy: 'Ali Hussain',
  },
  {
    id: 'JO-103',
    clientName: 'NextGen Innovations',
    startTime: '2025-07-13T10:00:00',
    endTime: '2025-07-13T18:00:00',
    status: 'Rejected',
    submittedBy: { 
      name: 'Zain Raza', 
      avatar: '', 
      role: 'Field Agent' 
    },
    approvedBy: 'N/A',
  },
  {
    id: 'JO-104',
    clientName: 'Greenline Projects',
    startTime: '2025-07-12T09:15:00',
    endTime: '2025-07-12T17:15:00',
    status: 'Draft',
    submittedBy: { 
      name: 'Mehwish Shah', 
      avatar: '', 
      role: 'Analyst' 
    },
    approvedBy: 'Pending',
  },
  {
    id: 'JO-105',
    clientName: 'Technovate Pvt Ltd',
    startTime: '2025-07-11T07:00:00',
    endTime: '2025-07-11T15:00:00',
    status: 'Approved',
    submittedBy: { 
      name: 'Ahmed Junaid', 
      avatar: '', 
      role: 'Technician' 
    },
    approvedBy: 'Ayesha Babar',
  },
  {
    id: 'JO-106',
    clientName: 'SkyCore Solutions',
    startTime: '2025-07-10T11:00:00',
    endTime: '2025-07-10T19:00:00',
    status: 'Submitted',
    submittedBy: { 
      name: 'Rubina Tariq', 
      avatar: '', 
      role: 'Coordinator' 
    },
    approvedBy: 'Bilal Nasir',
  },
  {
    id: 'JO-107',
    clientName: 'CloudFront Co.',
    startTime: '2025-07-09T08:45:00',
    endTime: '2025-07-09T16:45:00',
    status: 'Rejected',
    submittedBy: { 
      name: 'Zeeshan Waqar', 
      avatar: '', 
      role: 'Admin' 
    },
    approvedBy: 'N/A',
  },
];