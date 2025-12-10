export interface IIncidentReport {
  id?: string;
  dateOfIncident: string;
  timeOfIncident: string;
  incidentType: string;
  incidentSeverity: string;
  reportDescription: string;
  evidence?: string | null | undefined;
  status: string;
  reportedBy?: {
    name: string;
    photo_logo_url: string | null;
    role: string;
  };
}
