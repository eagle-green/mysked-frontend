import type { IDatePickerControl } from "./common";


interface IPagination {
   page: number;
   limit: number;
   total: number;
   totalPages: number;
}

interface IDataResponse {
   timesheet: TimeSheet[];
   pagination: IPagination;
}

interface ITimeSheetJob {
   id: string;
   job_number: number;
   po_number?: string | null;
   start_time: string;
   end_time: string;
   status: string;
   notes: string;
}

interface ITimeSheetCompany {
   name: string;
   logo_url: string | null;
}

interface ITimeSheetSite {
   name: string,
   unit_number: string,
   street_number: string,
   street_name: string,
   city: string,
   province: string,
   postal_code: string,
   country: string,
   display_address: string
}
interface ITimeSheetManager {
   id: string,
   first_name: string,
   last_name: string,
   email: string
}

export interface ITimeSheetEntries {
   id: string;
   timesheet_id: string;
   worker_id: string;
   job_worker_id: string;
   original_start_time: string;
   original_end_time: string;
   travel_start: string;
   shift_start: string;
   break_start: string;
   break_end: string;
   shift_end: string;
   travel_end: string;
   shift_total_minutes: number;
   break_total_minutes: number;
   travel_to_minutes: string;
   travel_during_minutes: string;
   travel_from_minutes: string;
   total_travel_minutes: number;
   total_work_minutes: number;
   travel_to_km: number;
   travel_during_km: number;
   travel_from_km: number;
   total_travel_km: number;
   worker_notes: string | null;
   admin_notes: string | null;
   mob?: boolean;
   break?: boolean;
   initial?: string | null;
   status: string;
   created_at: string;
   updated_at: string;
   worker_first_name: string;
   worker_last_name: string;
   worker_email: string;
   position: string;
   job_worker_status: string;
   worker_photo_url: string | null
}

export type TimeSheet = {
   id: string;
   job_id: string;
   timesheet_manager_id: string;
   timesheet_date: string;
   status: string;
   notes: string;
   confirmed_by: string;
   confirmed_at: string;
   admin_notes: string;
   rejection_reason: string | null;
   created_at: string;
   updated_at: string;
   job: ITimeSheetJob;
   company: ITimeSheetCompany;
   client: ITimeSheetCompany;
   site: ITimeSheetSite;
   manager: ITimeSheetManager;
}

export type TimeSheetDetails = {
   id: string,
   job_id: string,
   timesheet_manager_id: string,
   timesheet_date: string,
   status: string,
   notes: string,
   confirmed_at: string | null,
   admin_notes: string | null,
   rejection_reason: string | null,
   created_at: string,
   updated_at: string,
   job: {
      id: string,
      end_time: string,
      job_number: number,
      po_number?: string | null,
      notes: string,
      start_time: string,
      status: string
   },
   entries: ITimeSheetEntries[],
   confirmed_by: {
      id: string,
      email: string,
      first_name: string,
      last_name: string
   },
   company: {
      logo_url: string | null,
      name: string
   },
   client: {
      logo_url: string | null,
      name: string
   },
   timesheet_manager: {
      id: string,
      email: string,
      first_name: string,
      last_name: string
   },
   site: {
      city: string,
      country: string,
      display_address: string,
      name: string,
      postal_code: string,
      province: string,
      street_name: string,
      street_number: string,
      unit_number: string
   },
   signatures: []
}

export interface ITimeSheetApiResponse {
   success: boolean;
   data: IDataResponse;
}

export interface ITimeSheetTab {
  id: string;
  title: string;
  data: TimeSheet;
  isValid: boolean;
};

export type TimeEntryDateValidatorType = 'travel_end' | 'travel_start' | 'shift_end' | 'shift_start' | 'break_start' | 'break_end' | 'worker_notes';

export type TimeEntryDateValidators = {
   travel_start: IDatePickerControl | null,
   shift_start: IDatePickerControl | null,
   break_start: IDatePickerControl | null,
   break_end: IDatePickerControl | null,
   shift_end: IDatePickerControl | null,
   travel_end: IDatePickerControl | null,
   timesheet_date: IDatePickerControl | null
}