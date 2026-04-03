import type { TimesheetEntry } from 'src/types/job';

import dayjs from 'dayjs';
import { Buffer } from 'buffer';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import {
  Svg,
  Page,
  Text,
  View,
  Path,
  Image,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';

import {
  getTimesheetDateInVancouver,
  getJobStartCalendarDatePacific,
} from 'src/utils/timesheet-date';

import { roleList } from 'src/assets/data/assets';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Helper function to format position labels
const formatPositionLabel = (position: string | undefined): string => {
  if (!position) return '';
  const roleItem = roleList.find((role) => role.value === position);
  return roleItem ? roleItem.label : position.toUpperCase();
};

function formatVehicleTypeLabelForPdf(type?: string | null): string {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t === 'highway_truck') return 'HWY';
  if (t === 'lane_closure_truck') return 'LCT';
  return String(type);
}

function resolveEquipmentImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  return null;
}

function formatInventoryTypeForPdf(type?: string | null): string {
  if (!type) return '—';
  const s = String(type).trim();
  if (!s) return '—';
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatEquipmentDriverName(row: {
  vehicle_driver_first_name?: string | null;
  vehicle_driver_last_name?: string | null;
}): string | null {
  const parts = [row.vehicle_driver_first_name, row.vehicle_driver_last_name].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0
  );
  return parts.length ? parts.map((p) => p.trim()).join(' ') : null;
}

/**
 * @ag-media/react-pdf-table uses flex `weighting` per cell, not CSS width — values must sum to 1
 * (or any common ratio) so Item gets most of the row.
 */
const EQUIPMENT_LEFT_COL_WEIGHT = {
  item: 0.58,
  type: 0.16,
  qty: 0.04,
  vehicle: 0.22,
} as const;

const styles = StyleSheet.create({
  page: {
    padding: '0 20px',
    fontFamily: 'Helvetica',
    backgroundColor: '#ffff',
  },
  logo: {
    width: 70,
    height: 70,
  },
  section: {
    padding: 10,
    width: '100%',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  title: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'Helvetica-Bold',
    padding: 2,
  },
  paragraph: {
    lineHeight: 1.5,
    fontSize: 9,
    padding: 2,
  },
  contentSize: {
    width: '50%',
  },
  notes: {
    textAlign: 'left',
    width: '80%',
    paddingTop: 5,
  },
  table: {
    width: '95%',
    borderColor: '1px solid #EEEEEE',
    margin: '20px auto',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  tableHeader: {
    backgroundColor: '#E9E9E9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#000',
  },
  tableRow: {
    backgroundColor: '#F6F6F6',
  },
  td: {
    padding: 4,
    fontFamily: 'Helvetica',
    fontSize: 9,
    borderColor: '1px solid #E9E3DF',
    wordWrap: 'break-word',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  th: {
    padding: 2,
    borderColor: '1px solid #E9E9E9',
    wordWrap: 'break-word',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.2,
    flexDirection: 'column',
    display: 'flex',
  },
  thText: {
    fontSize: 8,
    lineHeight: 1.3,
  },
  // Column width styles
  colName: {
    width: 120,
    minWidth: 120,
  },
  colPosition: {
    width: 50,
    minWidth: 50,
  },
  colMob: {
    width: 30,
    minWidth: 30,
  },
  colStart: {
    width: 40,
    minWidth: 40,
  },
  colBreak: {
    width: 30,
    minWidth: 30,
  },
  colFinish: {
    width: 40,
    minWidth: 40,
  },
  colTotalHours: {
    width: 45,
    minWidth: 45,
  },
  colTravelTime: {
    width: 45,
    minWidth: 45,
  },
  colInitial: {
    width: 50,
    minWidth: 50,
  },
  tableContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  equipmentSectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  equipmentEmpty: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    padding: 8,
  },
  equipmentCell: {
    padding: 5,
    fontFamily: 'Helvetica',
    fontSize: 8,
    borderColor: '1px solid #E9E3DF',
    wordWrap: 'break-word',
    textAlign: 'left',
  },
  equipmentTh: {
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    borderColor: '1px solid #E9E9E9',
    backgroundColor: '#E9E9E9',
    textAlign: 'left',
  },
  equipmentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  equipmentThumb: {
    width: 36,
    height: 36,
    marginRight: 6,
    flexShrink: 0,
    objectFit: 'cover',
    borderRadius: 4,
  },
  equipmentThumbPlaceholder: {
    width: 36,
    height: 36,
    marginRight: 6,
    flexShrink: 0,
    backgroundColor: '#F4F6F8',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E3E8EE',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentItemNameWrap: {
    flex: 1,
    flexGrow: 1,
    minWidth: 0,
  },
  equipmentItemTd: {
    alignItems: 'center',
  },
  equipmentTableBodyText: {
    fontSize: 7.5,
  },
  equipmentQtyCell: {
    padding: 5,
    fontFamily: 'Helvetica',
    fontSize: 8,
    borderColor: '1px solid #E9E3DF',
    wordWrap: 'break-word',
    textAlign: 'center',
  },
});

/** Gray tile + 3D box — mirrors Equipment Left at Site (rounded Avatar + box icon). */
function EquipmentLeftAtSitePdfPlaceholder() {
  return (
    <View style={styles.equipmentThumbPlaceholder}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 3 L20.5 8 L12 13 L3.5 8 Z" fill="#B8C0CC" />
        <Path d="M3.5 8 L12 13 L12 21 L3.5 16 Z" fill="#8F99A8" />
        <Path d="M12 13 L20.5 8 L20.5 16 L12 21 Z" fill="#5F6B7A" />
      </Svg>
    </View>
  );
}

//----- Create the PDF document -----------------
type TimesheetPdfProps = {
  row?: TimesheetEntry;
  timesheetData?: any; // New prop for backend data
};

// Export a component that returns just the Page (for combining with invoice)
export function TimesheetPage({ timesheetData }: { timesheetData: any }) {
  const data = timesheetData;

  if (!data) return null;

  const { client, site, job, timesheet_manager } = data;
  const isTelus = job?.client_type?.toLowerCase() === 'telus';

  // Add safety checks for required data
  if (!client || !site || !job || !timesheet_manager) {
    console.error('Missing required data for PDF generation:', {
      client,
      site,
      job,
      timesheet_manager,
    });
    return null;
  }

  // Helper function to format hours without trailing zeros
  const formatHours = (minutes: number): string => {
    const hours = minutes / 60;
    // If it's a whole number, display without decimals
    if (hours % 1 === 0) {
      return hours.toString();
    }
    // Remove trailing zeros from decimal
    return parseFloat(hours.toFixed(2)).toString();
  };

  const jobStartYmd =
    getJobStartCalendarDatePacific(data.job?.start_time) ||
    getJobStartCalendarDatePacific((data as { job_start_time?: string }).job_start_time);
  const baseDate =
    jobStartYmd ||
    (data.timesheet?.timesheet_date
      ? String(data.timesheet.timesheet_date).split('T')[0]
      : null) ||
    (data.timesheet_date ? String(data.timesheet_date).split('T')[0] : null) ||
    null;
  const currentDate = getTimesheetDateInVancouver(baseDate).format('MM/DD/YYYY dddd');

  return (
    <Page size="A4" style={styles.page}>
      {/* Header with Logo, Ticket #, and Date */}
      <View
        style={[
          styles.section,
          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        ]}
      >
        <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.title, { fontSize: 14, fontWeight: 'bold' }]}>
            Ticket #: {job?.job_number || ''}
          </Text>
          <Text style={[styles.paragraph, { fontSize: 10, marginTop: 2 }]}>{currentDate}</Text>
        </View>
      </View>

      {/* 1. Customer | Client */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          <Text style={styles.title}>{isTelus ? 'TELUS' : 'Customer'}</Text>
          <Text style={styles.paragraph}>{data?.company?.name || ''}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>{isTelus ? 'Site Contact Name/Number' : 'Client'}</Text>
          <Text style={styles.paragraph}>
            {client?.name || ''} |{' '}
            {(() => {
              const phone = client?.phone_number || '';
              // Remove +1 prefix and format as XXX XXX XXXX
              if (phone.startsWith('+1') && phone.length === 12) {
                const digits = phone.substring(2);
                return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
              }
              return phone;
            })()}
          </Text>
        </View>
      </View>

      {/* 2. PO Number / Network Number / Job Location */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          {/* Purchase Order - only display if it has a value */}
          {job?.po_number && (
            <View style={{ marginBottom: job?.network_number ? 4 : 0 }}>
              <Text style={styles.title}>Purchase Order</Text>
              <Text style={styles.paragraph}>{job.po_number}</Text>
            </View>
          )}
          {/* Network Number/FSA - display if exists */}
          {job?.network_number && (
            <View>
              <Text style={styles.title}>Network Number/FSA</Text>
              <Text style={styles.paragraph}>{job.network_number}</Text>
            </View>
          )}
          {/* If both PO and Network Number are null, show Purchase Order label with empty value */}
          {!job?.po_number && !job?.network_number && (
            <View>
              <Text style={styles.title}>Purchase Order</Text>
              <Text style={styles.paragraph} />
            </View>
          )}
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>{job?.client_type?.toLowerCase() === 'telus' ? 'Work Location & City' : 'Job Location'}</Text>
          <Text style={styles.paragraph}>
            {site?.unit_number ? `${site.unit_number} - ` : ''}{site?.street_number} {site?.street_name}, {site?.city}{' '}
            {site?.province === 'British Columbia' ? 'BC' : site?.province} {site?.postal_code}
          </Text>
        </View>
      </View>

      {/* 3. Approver */}
      {job?.approver && (
        <View style={[styles.section, styles.container]}>
          <View style={styles.contentSize}>
            <Text style={styles.title}>{job?.client_type?.toLowerCase() === 'telus' ? 'TELUS Approver' : 'Approver'}</Text>
            <Text style={styles.paragraph}>{job.approver}</Text>
          </View>
          <View style={styles.contentSize} />
        </View>
      )}

      {/* Workers Table - Always show if entries exist, regardless of signature status */}
      {data.entries && Array.isArray(data.entries) && data.entries.length > 0 ? (
        (() => {
          // Filter entries to show workers who accepted the job or were cancelled
          // The backend should already filter this, but we add an extra safety check here
          const filteredEntries = data.entries.filter((entry: any) => 
            // Show entries from accepted workers and cancelled workers (for cancelled jobs that can still be billed)
            // If job_worker_status is available, use it; otherwise include the entry
            // (for backward compatibility with older data)
             (
              entry.job_worker_status === 'accepted' ||
              entry.job_worker_status === 'cancelled' ||
              (!entry.job_worker_status && entry.worker_id)
            )
          );

          // Always show table if we have any entries
          // This ensures the table structure is always visible when entries exist
          if (filteredEntries.length === 0) {
            // This shouldn't happen since we're not filtering, but just in case
            return (
              <View style={styles.section}>
                <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#666' }]}>
                  No worker entries available for this timesheet.
                </Text>
              </View>
            );
          }

          return (
            <View style={styles.tableContainer}>
              <Table style={styles.table}>
                <TH style={[styles.tableHeader]}>
                  <TD style={[styles.th, styles.colName]}>
                    <Text style={styles.thText}>Employee</Text>
                  </TD>
                  <TD style={[styles.th, styles.colPosition]}>
                    <Text style={styles.thText}>Position</Text>
                  </TD>
                  {!isTelus && (
                    <TD style={[styles.th, styles.colMob]}>
                      <Text style={styles.thText}>MOB</Text>
                    </TD>
                  )}
                  <TD style={[styles.th, styles.colStart]}>
                    <Text style={styles.thText}>Start</Text>
                  </TD>
                  <TD style={[styles.th, styles.colBreak]}>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={styles.thText}>Break</Text>
                      <Text style={styles.thText}>(min)</Text>
                    </View>
                  </TD>
                  <TD style={[styles.th, styles.colFinish]}>
                    <Text style={styles.thText}>End</Text>
                  </TD>
                  <TD style={[styles.th, styles.colTotalHours]}>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={styles.thText}>Total</Text>
                      <Text style={styles.thText}>Hours</Text>
                    </View>
                  </TD>
                  <TD style={[styles.th, styles.colTravelTime]}>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={styles.thText}>Travel</Text>
                      <Text style={styles.thText}>Time</Text>
                    </View>
                  </TD>
                  <TD style={[styles.th, styles.colInitial]}>
                    <Text style={styles.thText}>Initial</Text>
                  </TD>
                </TH>
                {filteredEntries.map((entry: any, index: number) => (
                  <TR
                    key={entry?.id || index}
                    style={[
                      styles.tableRow,
                      { backgroundColor: index % 2 === 0 ? '#F6F6F6' : '#FFFFFF' },
                    ]}
                  >
                    <TD
                      style={[styles.td, styles.colName]}
                    >{`${entry?.worker_first_name || ''} ${entry?.worker_last_name || ''}`}</TD>
                    <TD style={[styles.td, styles.colPosition]}>
                      {formatPositionLabel(entry?.position)}
                    </TD>
                    {!isTelus && (
                      <TD style={[styles.td, styles.colMob]}>{entry?.mob === true ? 'Yes' : ''}</TD>
                    )}
                    <TD style={[styles.td, styles.colStart]}>
                      {entry?.shift_start && entry.shift_start !== null && entry.shift_start !== ''
                        ? dayjs(entry.shift_start).tz('America/Vancouver').format('HH:mm')
                        : entry?.job_worker_start_time && entry.job_worker_start_time !== null && entry.job_worker_start_time !== ''
                        ? dayjs(entry.job_worker_start_time).tz('America/Vancouver').format('HH:mm')
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colBreak]}>
                      {entry?.break_minutes !== undefined && entry?.break_minutes !== null
                        ? `${entry.break_minutes} min`
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colFinish]}>
                      {entry?.shift_end && entry.shift_end !== null && entry.shift_end !== ''
                        ? dayjs(entry.shift_end).tz('America/Vancouver').format('HH:mm')
                        : entry?.job_worker_end_time && entry.job_worker_end_time !== null && entry.job_worker_end_time !== ''
                        ? dayjs(entry.job_worker_end_time).tz('America/Vancouver').format('HH:mm')
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colTotalHours]}>
                      {entry.shift_total_minutes && typeof entry.shift_total_minutes === 'number'
                        ? formatHours(entry.shift_total_minutes)
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colTravelTime]}>
                      {entry?.travel_time_minutes !== undefined &&
                      entry?.travel_time_minutes !== null &&
                      typeof entry.travel_time_minutes === 'number' &&
                      entry.travel_time_minutes > 0
                        ? formatHours(entry.travel_time_minutes)
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colInitial]}>
                      {entry?.initial && (
                        <Image src={entry.initial} style={{ width: '40px', height: '20px' }} />
                      )}
                    </TD>
                  </TR>
                ))}
              </Table>
            </View>
          );
        })()
      ) : (
        <View style={styles.section}>
          <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#666' }]}>
            No worker entries available for this timesheet.
          </Text>
        </View>
      )}

      {/* Vehicle information - placeholder for future implementation */}
      {/* Note: Vehicle data is not currently available in the timesheet data structure */}

      {/* Note Section */}
      {(data?.timesheet?.admin_notes ||
        data?.admin_notes ||
        data?.timesheet?.notes ||
        data?.notes) && (
        <View style={styles.section}>
          {(data?.timesheet?.notes || data?.notes) && (
            <View style={{ marginBottom: 5 }}>
              <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Bold' }]}>
                Timesheet Manager Note:
              </Text>
              <Text style={styles.paragraph}>{data?.timesheet?.notes || data?.notes || ''}</Text>
            </View>
          )}
          {(data?.timesheet?.admin_notes || data?.admin_notes) && (
            <View>
              <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Bold' }]}>Admin Note:</Text>
              <Text style={styles.paragraph}>
                {data?.timesheet?.admin_notes || data?.admin_notes || ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Message above signatures */}
      <View style={[styles.section, styles.container]}>
        <Text style={styles.paragraph}>
          By signing this invoice as a representative of the customer, you confirm that the hours
          and any equipment or inventory information recorded on this timesheet are accurate and
          that the work was performed by the named employee(s) in a satisfactory manner.
        </Text>
      </View>

      {/* Foreman Information */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Foreman Name:</Text>
          <Text style={styles.paragraph}>{client?.name || ''}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Foreman Signature:</Text>
          {data?.signatures &&
            data.signatures.length > 0 &&
            (() => {
              // Look for client signature (client_only type)
              const clientSignature = data.signatures.find(
                (sig: any) => sig.signature_type === 'client_only'
              );
              if (clientSignature?.signature_data) {
                try {
                  const signatureData = JSON.parse(clientSignature.signature_data);
                  if (signatureData.client) {
                    return (
                      <Image
                        src={signatureData.client}
                        style={{ width: '120px', height: '40px', marginTop: 5 }}
                      />
                    );
                  }
                } catch (e) {
                  console.error('Error parsing client signature:', e);
                }
              }
              return <Text style={styles.paragraph}>Not signed</Text>;
            })()}
        </View>
      </View>
    </Page>
  );
}

/** Dedicated PDF page for equipment left at site (client-facing confirmation). */
export function TimesheetEquipmentLeftPage({ timesheetData }: { timesheetData: any }) {
  const data = timesheetData;
  if (!data) return null;

  const { job } = data;
  const rows = Array.isArray(data.equipment_left) ? data.equipment_left : [];

  const jobStartYmd =
    getJobStartCalendarDatePacific(data.job?.start_time) ||
    getJobStartCalendarDatePacific((data as { job_start_time?: string }).job_start_time);
  const baseDate =
    jobStartYmd ||
    (data.timesheet?.timesheet_date
      ? String(data.timesheet.timesheet_date).split('T')[0]
      : null) ||
    (data.timesheet_date ? String(data.timesheet_date).split('T')[0] : null) ||
    null;
  const currentDate = getTimesheetDateInVancouver(baseDate).format('MM/DD/YYYY dddd');

  return (
    <Page size="A4" style={styles.page}>
      <View
        style={[
          styles.section,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          },
        ]}
      >
        <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.title, { fontSize: 14, fontWeight: 'bold' }]}>
            Ticket #: {job?.job_number || ''}
          </Text>
          <Text style={[styles.paragraph, { fontSize: 10, marginTop: 2 }]}>{currentDate}</Text>
        </View>
      </View>

      <Text style={styles.equipmentSectionTitle}>Equipment left at site</Text>

      {rows.length === 0 ? (
        <Text style={styles.equipmentEmpty}>
          No equipment or inventory was recorded as left at the job site for this timesheet.
        </Text>
      ) : (
        <>
          <Text style={[styles.paragraph, { fontSize: 9, marginBottom: 10, color: '#555' }]}>
            The following equipment or inventory was recorded as left at the job site for this
            timesheet.
          </Text>
          <View style={styles.tableContainer}>
          <Table style={styles.table}>
            <TH style={[styles.tableHeader]}>
              <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.item} style={styles.equipmentTh}>
                <Text style={styles.thText}>Item</Text>
              </TD>
              <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.type} style={styles.equipmentTh}>
                <Text style={styles.thText}>Type</Text>
              </TD>
              <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.qty} style={styles.equipmentTh}>
                <Text style={styles.thText}>Qty</Text>
              </TD>
              <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.vehicle} style={styles.equipmentTh}>
                <Text style={styles.thText}>Vehicle</Text>
              </TD>
            </TH>
            {rows.map((row: any, index: number) => {
              const vehicleLine = [
                formatVehicleTypeLabelForPdf(row.vehicle_type),
                row.license_plate || '',
                row.unit_number || '',
              ]
                .filter(Boolean)
                .join(' · ');
              const driverName = formatEquipmentDriverName(row);
              const vehicleBlock = [
                vehicleLine || null,
                driverName ? `Driver: ${driverName}` : null,
              ]
                .filter(Boolean)
                .join('\n');
              const thumbSrc = resolveEquipmentImageSrc(row.cover_url);
              return (
                <TR
                  key={row.id || index}
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? '#F6F6F6' : '#FFFFFF' },
                  ]}
                >
                  <TD
                    weighting={EQUIPMENT_LEFT_COL_WEIGHT.item}
                    style={[styles.equipmentCell, styles.equipmentItemTd]}
                  >
                    <View style={styles.equipmentItemRow}>
                      {thumbSrc ? (
                        <Image src={thumbSrc} style={styles.equipmentThumb} />
                      ) : (
                        <EquipmentLeftAtSitePdfPlaceholder />
                      )}
                      <View style={styles.equipmentItemNameWrap}>
                        <Text
                          hyphenationCallback={(word) => [word]}
                          style={styles.equipmentTableBodyText}
                        >
                          {row.inventory_name || '—'}
                        </Text>
                      </View>
                    </View>
                  </TD>
                  <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.type} style={styles.equipmentCell}>
                    <Text
                      hyphenationCallback={(word) => [word]}
                      style={styles.equipmentTableBodyText}
                    >
                      {formatInventoryTypeForPdf(row.inventory_type)}
                    </Text>
                  </TD>
                  <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.qty} style={styles.equipmentQtyCell}>
                    <Text style={styles.equipmentTableBodyText}>
                      {row.quantity != null ? String(row.quantity) : '—'}
                    </Text>
                  </TD>
                  <TD weighting={EQUIPMENT_LEFT_COL_WEIGHT.vehicle} style={styles.equipmentCell}>
                    <Text style={styles.equipmentTableBodyText}>{vehicleBlock || '—'}</Text>
                  </TD>
                </TR>
              );
            })}
          </Table>
        </View>
        </>
      )}
    </Page>
  );
}

// Component for timesheet image pages
export function TimesheetImagePage({
  imageUrl,
  timesheetData,
  imageIndex,
  totalImages,
}: {
  imageUrl: string;
  timesheetData: any;
  imageIndex: number;
  totalImages: number;
}) {
  const { job } = timesheetData;
  const jobStartYmd =
    getJobStartCalendarDatePacific(timesheetData.job?.start_time) ||
    getJobStartCalendarDatePacific((timesheetData as { job_start_time?: string }).job_start_time);
  const baseDate =
    jobStartYmd ||
    (timesheetData.timesheet?.timesheet_date
      ? String(timesheetData.timesheet.timesheet_date).split('T')[0]
      : null) ||
    (timesheetData.timesheet_date ? String(timesheetData.timesheet_date).split('T')[0] : null) ||
    null;
  const currentDate = getTimesheetDateInVancouver(baseDate).format('MM/DD/YYYY dddd');

  return (
    <Page size="A4" style={styles.page}>
      {/* Header with Logo, Ticket #, and Date */}
      <View
        style={[
          styles.section,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
            paddingBottom: 10,
          },
        ]}
      >
        <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.title, { fontSize: 14, fontWeight: 'bold' }]}>
            Ticket #: {job?.job_number || ''}
          </Text>
          <Text style={[styles.paragraph, { fontSize: 10, marginTop: 2 }]}>{currentDate}</Text>
        </View>
      </View>

      {/* Image - Large size, takes most of the page */}
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: 600,
          paddingTop: 10,
          paddingBottom: 30,
        }}
      >
        <Image
          src={imageUrl}
          style={{
            width: '100%',
            minHeight: 600,
            objectFit: 'contain',
          }}
        />
      </View>

      {/* Footer with image number */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          textAlign: 'center',
        }}
      >
        <Text style={[styles.paragraph, { textAlign: 'center', fontSize: 8 }]}>
          Timesheet Image {imageIndex + 1} of {totalImages}
        </Text>
      </View>
    </Page>
  );
}

export default function TimesheetPDF({ row, timesheetData }: TimesheetPdfProps) {
  const data = timesheetData || row;

  if (!data) return null;

  // Get images array, handle both formats (data.images or timesheet.images)
  const images = data.images || data.timesheet?.images || [];
  const validImages = Array.isArray(images)
    ? images.filter((img: string) => img && typeof img === 'string')
    : [];

  return (
    <Document>
      <TimesheetPage timesheetData={data} />
      <TimesheetEquipmentLeftPage timesheetData={data} />
      {/* Add separate page for each timesheet image */}
      {validImages.map((imageUrl: string, index: number) => (
        <TimesheetImagePage
          key={index}
          imageUrl={imageUrl}
          timesheetData={data}
          imageIndex={index}
          totalImages={validImages.length}
        />
      ))}
    </Document>
  );
}
