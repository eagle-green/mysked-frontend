import type { TimesheetEntry } from 'src/types/job';

import dayjs from 'dayjs';
import {TR, TH, TD, Table} from '@ag-media/react-pdf-table';
import {
  Page,
  Text,
  View,
  Image,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: "0 20px",
    fontFamily: 'Helvetica',
    backgroundColor: '#ffff',
  },
  logo: {
   width: 70,
   height: 70
  },
  section: {
    padding: 10,
    width: '100%'
  },
  container: {
   display: 'flex',
   justifyContent: 'space-between',
   flexDirection: "row"
  },
  title: {
   fontSize: 10,
   color: '#333',
   fontFamily: 'Helvetica-Bold',
   padding: 2
  },
  paragraph: {
   lineHeight: 1.5,
   fontSize: 9,
   padding: 2
  },
  contentSize: {
   width: '50%',
  },
  notes: {
   textAlign: 'left',
   width: '80%',
   paddingTop: 5
  },
  table: {
   width: '95%',
   borderColor: '1px solid #EEEEEE',
   margin: "20px auto",
   maxWidth: '100%',
   alignSelf: 'center'
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
   width: 60,
   minWidth: 60,
  },
  colInitial: {
   width: 60,
   minWidth: 60,
  },
  tableContainer: {
   display: 'flex',
   justifyContent: 'center',
   width: '100%'
  },
});

//----- Create the PDF document -----------------
type TimesheetPdfProps = {
   row?: TimesheetEntry;
   timesheetData?: any; // New prop for backend data
}
export default function TimesheetPDF({ row, timesheetData }: TimesheetPdfProps) {
   // Use backend data if available, otherwise fall back to row data
   const data = timesheetData || row;
   
   
   if (!data) return null;
   
   const { client, site, job, timesheet_manager } = data;
   
   // Add safety checks for required data
   if (!client || !site || !job || !timesheet_manager) {
     console.error('Missing required data for PDF generation:', { client, site, job, timesheet_manager });
     return null;
   }
   
   const currentDate = dayjs(data.timesheet?.timesheet_date || data.timesheet_date || data.job?.start_time).format('MM/DD/YYYY dddd');
   return (
      <Document>
            <Page size="A4" style={styles.page}>

               {/* Header with Logo, Ticket #, and Date */}
               <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                  <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
                  <View style={{ alignItems: 'flex-end' }}>
                     <Text style={[styles.title, { fontSize: 14, fontWeight: 'bold' }]}>Ticket #: {job?.job_number || ''}</Text>
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
                        {client?.name || ''} | {(() => {
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
                        {site?.street_number} {site?.street_name}, {site?.city} {site?.province === 'British Columbia' ? 'BC' : site?.province}, {site?.postal_code}
                     </Text>
                  </View>
               </View>


               {/* Timesheet Entries - map all workers related to this timesheet */}
               {data.entries && Array.isArray(data.entries) && data.entries.length > 0 && (
                 <View style={styles.tableContainer}>
                   <Table style={styles.table}>
                   <TH style={[styles.tableHeader]}>
                     <TD style={[styles.th, styles.colName]}>Employee</TD>
                     <TD style={[styles.th, styles.colPosition]}>Position</TD>
                     <TD style={[styles.th, styles.colMob]}>MOB</TD>
                     <TD style={[styles.th, styles.colStart]}>Start</TD>
                     <TD style={[styles.th, styles.colBreak]}>Break</TD>
                     <TD style={[styles.th, styles.colFinish]}>Finish</TD>
                     <TD style={[styles.th, styles.colTotalHours]}>Total Hours</TD>
                     <TD style={[styles.th, styles.colInitial]}>Initial</TD>
                   </TH>
                   {data.entries.map((entry: any, index: number) => (
                     <TR key={entry?.id || index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#F6F6F6' : '#FFFFFF' }]}>
                       <TD style={[styles.td, styles.colName]}>{`${entry?.worker_first_name || ''} ${entry?.worker_last_name || ''}`}</TD>
                       <TD style={[styles.td, styles.colPosition]}>{entry?.position ? entry.position.toUpperCase() : ''}</TD>
                       <TD style={[styles.td, styles.colMob]}>{entry?.mob === true ? 'Yes' : ''}</TD>
                       <TD style={[styles.td, styles.colStart]}>{entry?.shift_start ? dayjs(entry.shift_start).format('HH:mm') : ''}</TD>
                       <TD style={[styles.td, styles.colBreak]}>{entry?.break === true ? 'Yes' : ''}</TD>
                       <TD style={[styles.td, styles.colFinish]}>{entry?.shift_end ? dayjs(entry.shift_end).format('HH:mm') : ''}</TD>
                       <TD style={[styles.td, styles.colTotalHours]}>{entry.shift_total_minutes && typeof entry.shift_total_minutes === 'number' ? (entry.shift_total_minutes / 60).toFixed(2) : ''}</TD>
                       <TD style={[styles.td, styles.colInitial]}>
                         {entry?.initial && (
                           <Image
                             src={entry.initial}
                             style={{ width: '40px', height: '20px' }}
                           />
                         )}
                       </TD>
                     </TR>
                   ))}
                   </Table>
                 </View>
               )}

               {/* Vehicle information - placeholder for future implementation */}
               {/* Note: Vehicle data is not currently available in the timesheet data structure */}

               {/* Note Section */}
               <View style={styles.section}>
                  <Text style={styles.title}>Note</Text>
                  <Text style={styles.paragraph}>{data?.timesheet?.notes || data?.notes || ''}</Text>
               </View>

               {/* Message above signatures */}
               <View style={[styles.section, styles.container]}>
                  <Text style={styles.paragraph}> 
                     By Signing this invoice as a representiative of the customer confirms that the houts recorded are accurate and were performend by the name of the employee(s) in a satisfactory manner.
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
                     {data?.signatures && data.signatures.length > 0 && (() => {
                        // Look for client signature (client_only type)
                        const clientSignature = data.signatures.find((sig: any) => 
                          sig.signature_type === 'client_only'
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
         </Document>
      // <PDFViewer height={1000}>
         
      // </PDFViewer>
   );
}