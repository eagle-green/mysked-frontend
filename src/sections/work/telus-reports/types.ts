import type { IDatePickerControl } from 'src/types/common';

export interface ITelusReportFilters {
  status: string;
  reportType: string;
  startDate: IDatePickerControl | null;
  endDate: IDatePickerControl | null;
  query: string;
}

