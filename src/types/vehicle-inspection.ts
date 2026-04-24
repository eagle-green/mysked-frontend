export interface IDefectIssue {
  detect_type: string;
  notes: string;
  photo?: string;
}

export interface IVehicleInspection {
  field_name: string;
  label: string;
  is_required: boolean;
  has_defect: string;
  detect_issues: IDefectIssue;
}

export interface IPreTripVehicleInspection {
  id?: string;
  created_at: string;
  submitted_at: string;
  job_id: string;
  inspections: Array<IVehicleInspection>;
}

export interface IPreTripVehicleInspectionFilter {
  query: string;
  type: string[];
  vehicles: string[];
  status: string;
  startDate: string;
  endDate: string;
}
