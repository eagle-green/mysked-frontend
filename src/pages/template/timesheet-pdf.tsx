


import dayjs from 'dayjs';
import {Table, TR, TH, TD} from '@ag-media/react-pdf-table';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  PDFViewer,
} from '@react-pdf/renderer';

import { TimesheetEntry } from 'src/types/job';

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
   row: TimesheetEntry
}
export default function TimesheetPDF({ row }: TimesheetPdfProps) {
   const { client, site, job, timesheet_manager, confirmed_by } = row;
   const currentDate = dayjs(row.timesheet_date).format('MM/DD/YYYY');
   return (
      <Document>
            <Page size="A4" style={styles.page}>

               <View style={styles.section}>
                  <Image style={styles.logo} src="/logo/eaglegreen-single.png" />
               </View>

               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Client</Text>
                     <Text style={styles.paragraph}>{client.name}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Job #</Text>
                     <Text style={styles.paragraph}>{job.job_number}</Text>
                  </View>
               </View>

               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Site Address</Text>
                     <Text style={styles.paragraph}>{site.display_address}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Date</Text>
                     <Text style={styles.paragraph}>{currentDate}</Text>
                  </View>
               </View>

               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Approved By</Text>
                     <Text style={styles.paragraph}>{`${confirmed_by?.first_name ?? ''} ${confirmed_by?.last_name ?? ''}`}</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Submitted By</Text>
                     <Text style={styles.paragraph}>{`${timesheet_manager.first_name} ${timesheet_manager.last_name}`}</Text>
                  </View>
               </View>

               <View style={[styles.section, styles.contentSize]}>
                  <Text style={styles.title}>PO # | NW #</Text>
                  <Text style={styles.paragraph}>PO-1</Text>
               </View>

               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Job Notes</Text>
                     <Text style={[styles.paragraph, styles.notes]}>
                        {job.notes}
                     </Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Admin Notes</Text>
                     <Text style={[styles.paragraph, styles.notes]}>
                       {row.admin_notes}
                     </Text>
                  </View>
               </View>

               {/* Need Timesheet Entries here to map all workers related to this timesheet  */}
               <Table style={styles.table}>
                  <TH style={[styles.tableHeader]}>
                     <TD style={styles.th}>Name</TD>
                     <TD style={styles.th}>Travel Start</TD>
                     <TD style={styles.th}>Shift Start</TD>
                     <TD style={styles.th}>Break Start</TD>
                     <TD style={styles.th}>Break End</TD>
                     <TD style={styles.th}>Shift End</TD>
                     <TD style={styles.th}>Travel End</TD>
                     <TD style={styles.th}>Shift Total (excl. break)</TD>
                     <TD style={styles.th}>Travel To (km)</TD>
                     <TD style={styles.th}>Travel During (km)</TD>
                     <TD style={styles.th}>Travel From (km)</TD>
                  </TH>
                  <TR style={styles.tableRow}>
                     <TD style={styles.td}>Jerwin Fortillano</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>9:00</TD>
                     <TD style={styles.td}>12:00</TD>
                     <TD style={styles.td}>13:00</TD>
                     <TD style={styles.td}>18:00</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>8</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>-</TD>
                  </TR>
                  <TR style={styles.tableRow}>
                     <TD style={styles.td}>Kiwoon Jung</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>9:00</TD>
                     <TD style={styles.td}>12:00</TD>
                     <TD style={styles.td}>13:00</TD>
                     <TD style={styles.td}>18:00</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>8</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>-</TD>
                     <TD style={styles.td}>-</TD>
                  </TR>
               </Table>

               {/* Need Vehicle objects to map the data*/}
               <Table style={styles.table}>
                  <TH style={[styles.tableHeader]}>
                     <TD style={styles.th}>Vehicle</TD>
                     <TD style={styles.th}>License Plate</TD>
                     <TD style={styles.th}>Unit Number</TD>
                     <TD style={styles.th}>Driver</TD>
                  </TH>
                  <TR style={styles.tableRow}>
                     <TD style={styles.td}>Lane Closure Truck</TD>
                     <TD style={styles.td}>000123</TD>
                     <TD style={styles.td}>123000</TD>
                     <TD style={styles.td}>Allen Iverson</TD>
                  </TR>
               </Table>

               {/* Need Sinature Objects here */}
               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Text style={styles.title}>Timesheet Manager Signature</Text>
                     <Text style={styles.paragraph}>Kiwoon Jung</Text>
                  </View>
                  <View style={styles.contentSize}>
                     <Text style={[styles.title, ]}>Client Signature</Text>
                     <Text style={styles.paragraph}>Kessia</Text>
                  </View>
               </View>

               <View style={[styles.section, styles.container]}>
                  <Text style={styles.paragraph}> 
                     I have read the shift notes and confirm any timesheet exceptions:
                  </Text>
               </View>

               <View style={[styles.section, styles.container]}>
                  <View style={styles.contentSize}>
                     <Image style={styles.logo} src="data:image/png;base64,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" />
                  </View>
                  <View style={styles.contentSize}>
                     <Image style={styles.logo} src="data:image/png;base64,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" />
                  </View>
               </View>

            </Page>
         </Document>
      // <PDFViewer height={1000}>
         
      // </PDFViewer>
   );
}