import type { TimesheetEntry } from 'src/types/job';

import dayjs from 'dayjs';
import { Buffer } from 'buffer';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { getTimesheetDateInVancouver } from 'src/utils/timesheet-date';

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
});

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

  const baseDate =
    data.job?.start_time || data.timesheet?.timesheet_date || data.timesheet_date || null;
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
          <Text style={styles.title}>Customer</Text>
          <Text style={styles.paragraph}>{data?.company?.name || ''}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Client</Text>
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

      {/* 2. PO # | NW # | Job Location */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          <Text style={styles.title}>PO # | NW #</Text>
          <Text style={styles.paragraph}>{job?.po_number || ''}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Job Location</Text>
          <Text style={styles.paragraph}>
            {site?.street_number} {site?.street_name}, {site?.city}{' '}
            {site?.province === 'British Columbia' ? 'BC' : site?.province}, {site?.postal_code}
          </Text>
        </View>
      </View>

      {/* Workers Table - Always show if entries exist, regardless of signature status */}
      {data.entries && Array.isArray(data.entries) && data.entries.length > 0 ? (
        (() => {
          // Filter entries to only show workers who accepted the job
          // The backend should already filter this, but we add an extra safety check here
          const filteredEntries = data.entries.filter((entry: any) => 
            // Only show entries from accepted workers
            // If job_worker_status is available, use it; otherwise include the entry
            // (for backward compatibility with older data)
             (
              entry.job_worker_status === 'accepted' ||
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
                  <TD style={[styles.th, styles.colMob]}>
                    <Text style={styles.thText}>MOB</Text>
                  </TD>
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
                    <TD style={[styles.td, styles.colMob]}>{entry?.mob === true ? 'Yes' : ''}</TD>
                    <TD style={[styles.td, styles.colStart]}>
                      {entry?.shift_start
                        ? dayjs(entry.shift_start).tz('America/Vancouver').format('HH:mm')
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colBreak]}>
                      {entry?.break_minutes !== undefined && entry?.break_minutes !== null
                        ? `${entry.break_minutes} min`
                        : ''}
                    </TD>
                    <TD style={[styles.td, styles.colFinish]}>
                      {entry?.shift_end
                        ? dayjs(entry.shift_end).tz('America/Vancouver').format('HH:mm')
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
          recorded are accurate and were performed by the named employee(s) in a satisfactory
          manner.
        </Text>
      </View>

      {/* Foreman Information */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Foreman Name:</Text>
          <Text style={styles.paragraph}>{client?.name || ''}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Client Signature:</Text>
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
  const baseDate =
    timesheetData.job?.start_time ||
    timesheetData.timesheet?.timesheet_date ||
    timesheetData.timesheet_date ||
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

// Component for timesheet image pages
export function TimesheetImagePage({ 
  imageUrl, 
  timesheetData, 
  imageIndex, 
  totalImages 
}: { 
  imageUrl: string; 
  timesheetData: any;
  imageIndex: number;
  totalImages: number;
}) {
  const { job } = timesheetData;
  const baseDate =
    timesheetData.job?.start_time ||
    timesheetData.timesheet?.timesheet_date ||
    timesheetData.timesheet_date ||
    null;
    const currentDate = getTimesheetDateInVancouver(baseDate).format('MM/DD/YYYY dddd');

  return (
    <Page size="A4" style={styles.page}>
      {/* Header with Logo, Ticket #, and Date */}
      <View
        style={[
          styles.section,
          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 10 },
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
