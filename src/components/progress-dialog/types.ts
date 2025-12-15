import type { ReactNode } from 'react';

export type ProgressStep = {
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  error?: string;
  icon?: ReactNode;
  count?: number; // For showing progress like "5/10 orders processed"
};
