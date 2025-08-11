import { IDatePickerControl } from "./common";

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
   travel_start: string | null;
   shift_start: string | null;
   break_start: string | null;
   break_end: string | null;
   shift_end: string | null;
   travel_end: string | null;
   shift_total_minutes: number | null;
   break_total_minutes: number | null;
   travel_to_minutes: string | null;
   travel_during_minutes: string | null;
   travel_from_minutes: string | null;
   total_work_minutes: number | null;
   travel_to_km: number | null;
   travel_during_km: number| null;
   travel_from_km: number | null;
   total_travel_km: number | null;
   worker_notes: string;
   admin_notes: string | null;
   status: string;
   created_at: string;
   updated_at: string;
   worker_first_name: string;
   worker_last_name: string;
   worker_email: string;
   position: string;
   job_worker_status: string;
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
   confirmed_by: string | null,
   confirmed_at: string | null,
   admin_notes: string | null,
   created_at: string,
   updated_at: string,
   job_number: number,
   job_start_time: string,
   job_end_time: string,
   job_status: string,
   job_notes: string,
   company_name: string,
   client_name: string,
   site_name: string,
   manager_first_name: string,
   manager_last_name: string,
   manager_email: string,
   confirmed_by_first_name: null,
   confirmed_by_last_name: null,
   confirmed_by_email: null,
   entries: ITimeSheetEntries[],
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

export type TimeEntryDateValidatorType = 'travel_end' | 'travel_start' | 'shift_end' | 'shift_start' | 'break_start' | 'break_end';

export type TimeEntryDateValidators = {
   travel_start: IDatePickerControl | null,
   shift_start: IDatePickerControl | null,
   break_start: IDatePickerControl | null,
   break_end: IDatePickerControl | null,
   shift_end: IDatePickerControl | null,
   travel_end: IDatePickerControl | null,
   timesheet_date: IDatePickerControl | null
}