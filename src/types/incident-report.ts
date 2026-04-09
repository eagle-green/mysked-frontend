export interface IIncidentReport {
  id?: string;
  dateOfIncident: string;
  timeOfIncident: string;
  incidentType: string;
  incidentSeverity: string;
  reportDescription: string;
  evidence?: string | null | undefined;
  status: string;
  /** Optional — traffic / ICBC (BC) claim reference */
  icbcClaimNumber?: string | null;
  /** Optional — police file / occurrence number */
  policeFileNumber?: string | null;
  reportedBy?: {
    name: string;
    photo_logo_url: string | null;
    role: string;
  };
}
