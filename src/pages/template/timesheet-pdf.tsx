
import dayjs from 'dayjs';
import { useMemo } from 'react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Page, Text, View, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf' }],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        page: {
          fontSize: 9,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '40px 24px 120px 24px',
        },
        footer: {
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          margin: 'auto',
          borderTopWidth: 1,
          borderStyle: 'solid',
          position: 'absolute',
          borderColor: '#e9ecef',
        },
        container: { flexDirection: 'row', justifyContent: 'space-between' },
        section: { marginBottom: 10 },
        contentSize: { width: '48%' },
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb40: { marginBottom: 40 },
        h3: { fontSize: 16, fontWeight: 700, lineHeight: 1.2 },
        h4: { fontSize: 12, fontWeight: 700 },
        text1: { fontSize: 10 },
        text2: { fontSize: 9 },
        text1Bold: { fontSize: 10, fontWeight: 700 },
        text2Bold: { fontSize: 9, fontWeight: 700 },
        title: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
        paragraph: { fontSize: 9, lineHeight: 1.4 },
        table: { display: 'flex', width: '100%', marginTop: 8 },
        row: {
          padding: '8px 0',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#e9ecef',
        },
        cell_1: { width: '20%' },
        cell_2: { width: '25%' },
        cell_3: { width: '15%' },
        cell_4: { width: '15%' },
        cell_5: { width: '15%' },
        cell_6: { width: '10%' },
      }),
    []
  );

type TimesheetPDFProps = {
  timesheetData: any;
};

export function TimesheetPage({ timesheetData }: { timesheetData: any }) {
  const styles = useStyles();
  const data = timesheetData || {};

  const job = data.job || {};
  const client = data.client || {};
  const company = data.company || {};
  const site = data.site || {};

  // Format timesheet date
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    try {
      return dayjs(date).tz('America/Vancouver').format('MMM DD, YYYY');
    } catch {
      return '';
    }
  };

  // Format time
  const formatTime = (time: string | Date | null | undefined): string => {
    if (!time) return '';
    try {
      return dayjs(time).tz('America/Vancouver').format('h:mm A');
    } catch {
      return '';
    }
  };

  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={[styles.container, styles.mb40]}>
        <Image src="/logo/eaglegreen-full.jpeg" style={{ width: '100px', height: '100px' }} />
        <View style={{ alignItems: 'flex-end', flexDirection: 'column' }}>
          <Text style={styles.h3}>Timesheet</Text>
          {data.timesheet?.timesheet_date && (
            <Text style={styles.text2}>{formatDate(data.timesheet.timesheet_date)}</Text>
          )}
        </View>
      </View>

      {/* 1. Customer | Client */}
      <View style={[styles.section, styles.container]}>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Customer</Text>
          <Text style={styles.paragraph}>{company.name || '-'}</Text>
        </View>
        <View style={styles.contentSize}>
          <Text style={styles.title}>Client</Text>
          <Text style={styles.paragraph}>{client.name || '-'}</Text>
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
          <Text style={styles.title}>Job Location</Text>
          <Text style={styles.paragraph}>
            {site?.street_number} {site?.street_name}, {site?.city}{' '}
            {site?.province === 'British Columbia' ? 'BC' : site?.province}, {site?.postal_code}
          </Text>
        </View>
      </View>

      {/* 3. Approver */}
      {job?.approver && (
        <View style={[styles.section, styles.container]}>
          <View style={styles.contentSize}>
            <Text style={styles.title}>Approver</Text>
            <Text style={styles.paragraph}>{job.approver}</Text>
          </View>
          <View style={styles.contentSize} />
        </View>
      )}

      {/* Workers Table - Always show if entries exist, regardless of signature status */}
      {data.entries && Array.isArray(data.entries) && data.entries.length > 0 ? (
        (() => {
          const filteredEntries = data.entries.filter(
            (entry: any) =>
              entry.job_worker_status === 'accepted' || entry.job_worker_status === 'cancelled'
          );

          if (filteredEntries.length === 0) return null;

          return (
            <View style={styles.table}>
              <View>
                <View style={styles.row}>
                  <View style={styles.cell_1}>
                    <Text style={styles.text2Bold}>Worker</Text>
                  </View>
                  <View style={styles.cell_2}>
                    <Text style={styles.text2Bold}>Position</Text>
                  </View>
                  <View style={styles.cell_3}>
                    <Text style={styles.text2Bold}>Start Time</Text>
                  </View>
                  <View style={styles.cell_4}>
                    <Text style={styles.text2Bold}>End Time</Text>
                  </View>
                  <View style={styles.cell_5}>
                    <Text style={styles.text2Bold}>Break</Text>
                  </View>
                  <View style={styles.cell_6}>
                    <Text style={styles.text2Bold}>Total</Text>
                  </View>
                </View>
              </View>
              <View>
                {filteredEntries.map((entry: any) => {
                  const startTime = entry.shift_start || entry.job_worker_start_time;
                  const endTime = entry.shift_end || entry.job_worker_end_time;
                  const breakMinutes = entry.break_minutes || 0;
                  const totalMinutes = entry.shift_total_minutes || 0;

                  return (
                    <View key={entry.id} style={styles.row}>
                      <View style={styles.cell_1}>
                        <Text style={styles.text2}>
                          {entry.worker_first_name} {entry.worker_last_name}
                        </Text>
                      </View>
                      <View style={styles.cell_2}>
                        <Text style={styles.text2}>{entry.position || '-'}</Text>
                      </View>
                      <View style={styles.cell_3}>
                        <Text style={styles.text2}>{formatTime(startTime)}</Text>
                      </View>
                      <View style={styles.cell_4}>
                        <Text style={styles.text2}>{formatTime(endTime)}</Text>
                      </View>
                      <View style={styles.cell_5}>
                        <Text style={styles.text2}>{formatDuration(breakMinutes)}</Text>
                      </View>
                      <View style={styles.cell_6}>
                        <Text style={styles.text2}>{formatDuration(totalMinutes)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()
      ) : null}

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
  const styles = useStyles();

  return (
    <Page size="A4" style={styles.page}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          src={imageUrl}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
        {totalImages > 1 && (
          <Text style={[styles.text2, { marginTop: 10 }]}>
            Image {imageIndex + 1} of {totalImages}
          </Text>
        )}
      </View>
    </Page>
  );
}

// Default export for backward compatibility
export default function TimesheetPDF({ timesheetData }: TimesheetPDFProps) {
  return (
    <Document>
      <TimesheetPage timesheetData={timesheetData} />
    </Document>
  );
}
