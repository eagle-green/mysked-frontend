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
   width: '100%',
   borderColor: '1px solid #EEEEEE',
   margin: "20px 0"
  },
  tableHeader: {
   backgroundColor: '#E9E9E9',
   fontFamily: 'Helvetica-Bold',
   fontSize: 7,
   color: '#000',
  },
  tableRow: {
   backgroundColor: '#F6F6F6',
  },
  td: {
   padding: 6,
   fontFamily: 'Helvetica',
   fontSize: 6,
   borderColor: '1px solid #E9E3DF',
  },
  th: {
   padding: 3,
   borderColor: '1px solid #E9E9E9',
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
   
   const { client, site, job, timesheet_manager, confirmed_by } = data;
   
   // Add safety checks for required data
   if (!client || !site || !job || !timesheet_manager) {
     console.error('Missing required data for PDF generation:', { client, site, job, timesheet_manager });
     return null;
   }
   
   const currentDate = dayjs(data.timesheet?.timesheet_date || data.timesheet_date || data.job?.start_time).format('MM/DD/YYYY');
   return (
      <Document>
            <Page size="A4" style={styles.page}>

               <View style={styles.section}>
                  <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
               </View>

               {/* 1. Client */}
               <View style={[styles.section, styles.contentSize]}>
                  <Text style={styles.title}>Client</Text>
                  <Text style={styles.paragraph}>{client?.name || 'N/A'}</Text>
               </View>

               {/* 2. Job # | PO # | NW # */}
               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Job #</Text>
                     <Text style={styles.paragraph}>{job?.job_number || 'N/A'}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>PO # | NW #</Text>
                     <Text style={styles.paragraph}>{job?.po_number || 'N/A'}</Text>
                  </View>
               </View>

               {/* 3. Date | Site Address */}
               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Date</Text>
                     <Text style={styles.paragraph}>{currentDate}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Site Address</Text>
                     <View>
                        <Text style={styles.paragraph}>
                           {site?.street_number} {site?.street_name}, {site?.city}
                        </Text>
                        <Text style={styles.paragraph}>
                           {site?.province} {site?.postal_code}, {site?.country}
                        </Text>
                     </View>
                  </View>
               </View>

               {/* 4. Submitted By | Approved By */}
               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Submitted By</Text>
                     <Text style={styles.paragraph}>{`${timesheet_manager?.first_name || ''} ${timesheet_manager?.last_name || ''}`}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Approved By</Text>
                     <Text style={styles.paragraph}>{`${confirmed_by?.first_name ?? ''} ${confirmed_by?.last_name ?? ''}`}</Text>
                  </View>
               </View>

               {/* 5. Job Notes | Admin Notes */}
               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Job Notes</Text>
                     <Text style={[styles.paragraph, styles.notes]}>
                        {job?.notes || 'No notes'}
                     </Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Admin Notes</Text>
                     <Text style={[styles.paragraph, styles.notes]}>
                       {data.timesheet?.admin_notes || data.admin_notes || ''}
                     </Text>
                  </View>
               </View>

               {/* Timesheet Entries - map all workers related to this timesheet */}
               {data.entries && Array.isArray(data.entries) && data.entries.length > 0 && (
                 <Table style={styles.table}>
                   <TH style={[styles.tableHeader]}>
                     <TD style={styles.th}>Name</TD>
                     <TD style={styles.th}>Position</TD>
                     <TD style={styles.th}>Travel Start</TD>
                     <TD style={styles.th}>Shift Start</TD>
                     <TD style={styles.th}>Break Start</TD>
                     <TD style={styles.th}>Break End</TD>
                     <TD style={styles.th}>Shift End</TD>
                     <TD style={styles.th}>Travel End</TD>
                     <TD style={styles.th}>Shift Total (hrs)</TD>
                     <TD style={styles.th}>Break Total (hrs)</TD>
                     <TD style={styles.th}>Travel Total (hrs)</TD>
                     <TD style={styles.th}>Total Work (hrs)</TD>
                     <TD style={styles.th}>Travel Distance (km)</TD>
                   </TH>
                   {data.entries.map((entry: any, index: number) => (
                     <TR key={entry?.id || index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#F6F6F6' : '#FFFFFF' }]}>
                       <TD style={styles.td}>{`${entry?.worker_first_name || ''} ${entry?.worker_last_name || ''}`}</TD>
                       <TD style={styles.td}>{entry?.position || '-'}</TD>
                       <TD style={styles.td}>{entry?.travel_start ? dayjs(entry.travel_start).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry?.shift_start ? dayjs(entry.shift_start).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry?.break_start ? dayjs(entry.break_start).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry?.break_end ? dayjs(entry.break_end).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry?.shift_end ? dayjs(entry.shift_end).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry?.travel_end ? dayjs(entry.travel_end).format('HH:mm') : '-'}</TD>
                       <TD style={styles.td}>{entry.shift_total_minutes && typeof entry.shift_total_minutes === 'number' ? (entry.shift_total_minutes / 60).toFixed(2) : '-'}</TD>
                       <TD style={styles.td}>{entry.break_total_minutes && typeof entry.break_total_minutes === 'number' ? (entry.break_total_minutes / 60).toFixed(2) : '-'}</TD>
                       <TD style={styles.td}>{(() => {
                         const travelTo = entry.travel_to_minutes || 0;
                         const travelDuring = entry.travel_during_minutes || 0;
                         const travelFrom = entry.travel_from_minutes || 0;
                         const totalTravel = travelTo + travelDuring + travelFrom;
                         return totalTravel > 0 ? (totalTravel / 60).toFixed(2) : '-';
                       })()}</TD>
                       <TD style={styles.td}>{entry.total_work_minutes && typeof entry.total_work_minutes === 'number' ? (entry.total_work_minutes / 60).toFixed(2) : '-'}</TD>
                       <TD style={styles.td}>{(() => {
                         const travelTo = entry.travel_to_km || 0;
                         const travelDuring = entry.travel_during_km || 0;
                         const travelFrom = entry.travel_from_km || 0;
                         const totalDistance = travelTo + travelDuring + travelFrom;
                         return totalDistance > 0 ? totalDistance.toFixed(2) : '-';
                       })()}</TD>
                     </TR>
                   ))}
                 </Table>
               )}

               {/* Vehicle information - placeholder for future implementation */}
               {/* Note: Vehicle data is not currently available in the timesheet data structure */}

               {/* Message above signatures */}
               <View style={[styles.section, styles.container]}>
                  <Text style={styles.paragraph}> 
                     I have read the shift notes and confirm any timesheet exceptions:
                  </Text>
               </View>

               {/* Signature Objects */}
               {data.signatures && Array.isArray(data.signatures) && data.signatures.length > 0 && (
                 <View style={[styles.section, styles.container]}>
                   {data.signatures.map((signature: any, index: number) => (
                       <View key={signature?.id || Math.random()} style={styles.contentSize}>
                         <Text style={styles.title}>
                           {signature?.signature_type === 'timesheet_manager' ? 'Timesheet Manager Signature' : 
                            signature?.signature_type === 'client' ? 'Client Signature' : 'Signature'}
                         </Text>
                         <Text style={styles.paragraph}>{signature?.signed_by || 'Unknown'}</Text>
                         <Text style={styles.paragraph}>
                           {signature?.signed_at ? dayjs(signature.signed_at).format('MM/DD/YYYY HH:mm') : ''}
                         </Text>
                         
                         {/* Debug info */}
                         <Text style={styles.paragraph}>
                           Signature type: {signature?.signature_type || 'unknown'}
                         </Text>
                         <Text style={styles.paragraph}>
                           Has signature data: {signature?.signature_data ? 'Yes' : 'No'}
                         </Text>
                         
                         {/* Display signature image if available */}
                         {(() => {
                           try {
                             // Try to parse signature_data as JSON first
                             if (signature?.signature_data && typeof signature.signature_data === 'string') {
                               if (signature.signature_data.startsWith('{')) {
                                 // It's a JSON string, parse it
                                 const parsedData = JSON.parse(signature.signature_data);
                                 
                                 // For timesheet manager signatures, show the timesheet_manager signature
                                 if (signature.signature_type === 'timesheet_manager' || signature.signature_type === 'timesheet_manager_only') {
                                   if (parsedData.timesheet_manager) {
                                     return (
                                       <View style={{ marginTop: 10, border: '1px solid #ccc', padding: 5 }}>
                                         <Image 
                                           src={`data:image/png;base64,${parsedData.timesheet_manager}`}
                                           style={{ width: 150, height: 60 }}
                                         />
                                       </View>
                                     );
                                   }
                                 }
                                 
                                 // For client signatures, show the client signature
                                 if (signature.signature_type === 'client') {
                                   if (parsedData.client) {
                                     return (
                                       <View style={{ marginTop: 10, border: '1px solid #ccc', padding: 5 }}>
                                         <Image 
                                           src={`data:image/png;base64,${parsedData.client}`}
                                           style={{ width: 150, height: 60 }}
                                         />
                                       </View>
                                     );
                                   }
                                 }
                                 
                                 // For composite signatures, show both
                                 if (signature.signature_type === 'composite') {
                                   return (
                                     <View style={{ marginTop: 10, border: '1px solid #ccc', padding: 5 }}>
                                       {parsedData.timesheet_manager && (
                                         <View style={{ marginBottom: 10 }}>
                                           <Text style={styles.paragraph}>Manager:</Text>
                                           <Image 
                                             src={`data:image/png;base64,${parsedData.timesheet_manager}`}
                                             style={{ width: 150, height: 60 }}
                                           />
                                         </View>
                                       )}
                                       {parsedData.client && (
                                         <View>
                                           <Text style={styles.paragraph}>Client:</Text>
                                           <Image 
                                             src={`data:image/png;base64,${parsedData.client}`}
                                             style={{ width: 150, height: 60 }}
                                           />
                                         </View>
                                       )}
                                     </View>
                                   );
                                 }
                               } else {
                                 // It's a direct base64 string
                                 return (
                                   <View style={{ marginTop: 10, border: '1px solid #ccc', padding: 5 }}>
                                     <Image 
                                       src={`data:image/png;base64,${signature.signature_data}`}
                                       style={{ width: 150, height: 60 }}
                                     />
                                   </View>
                                 );
                               }
                             }
                             return null;
                           } catch (error) {
                             console.error('Error parsing signature data:', error);
                             return (
                               <View style={{ marginTop: 10, border: '1px solid #ccc', padding: 5 }}>
                                 <Text style={styles.paragraph}>
                                   Error parsing signature: {error instanceof Error ? error.message : 'Unknown error'}
                                 </Text>
                               </View>
                             );
                           }
                         })()}
                       </View>
                     ))}
                 </View>
               )}
               
               {/* Debug: Show if no signatures */}
               {(!data.signatures || !Array.isArray(data.signatures) || data.signatures.length === 0) && (
                 <View style={[styles.section, styles.container]}>
                   <Text style={styles.paragraph}>
                     No signatures found. Available data: {JSON.stringify({
                       hasSignatures: !!data.signatures,
                       signaturesType: typeof data.signatures,
                       signaturesLength: data.signatures?.length,
                       signatureKeys: data.signatures ? Object.keys(data.signatures) : 'none'
                     })}
                   </Text>
                 </View>
               )}

            </Page>
         </Document>
      // <PDFViewer height={1000}>
         
      // </PDFViewer>
   );
}