import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import {
  Svg,
  Page,
  Text,
  View,
  Font,
  Path,
  Image,
  Document,
  StyleSheet,
  PDFViewer,
} from '@react-pdf/renderer';

Font.register({
  family: 'Roboto-Bold',
  src: '/fonts/Roboto-Bold.ttf',
});

Font.register({
  family: 'Roboto-Regular',
  src: '/fonts/Roboto-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: '50px 30px 80px 30px',
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    logo: {
      width: 95,
      hieght: 95,
    },
  },
  taxTableContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  table: {
    border: '1px solid #000',
  },
  tableHeader: {
    fontSize: 8,
    color: '#000',
  },
  tableHeaderColored: {
    color: '#000',
    fontSize: 10,
    backgroundColor: '#e6e6e6',
  },
  td: {
    fontFamily: 'Roboto-Regular',
    fontSize: 9,
    padding: '2px 3px',
    // border: '1px solid #000',
  },
  th: {
    height: 25,
    padding: '1px 2px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  column: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  borderedContainer: {
    border: '1px solid #000',
    padding: 5,
  },
});

//-------------------------------------------------------------------------------

const Banner = () => (
  <View
    style={{
      position: 'relative',
      top: 0,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Image src="/pdf/banner.png" style={{ height: 'auto', maxHeight: 100 }} fixed />
  </View>
);

const FooterBanner = () => (
  <View
    style={{
      position: 'relative',
      top: 0,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Image src="/pdf/banner-footer.png" style={{ height: 'auto', maxHeight: 100 }} fixed />
  </View>
);

const HeaderSection = () => (
  <View style={styles.header}>
    <View
      style={{
        width: '70%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <Image style={styles.header.logo} src="/logo/eaglegreen-single.png" />
    </View>
    <View style={[styles.taxTableContainer, { width: '30%' }]}>
      <View style={{ width: '180px' }}>
        <Text style={{ fontSize: 12, textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
          TAX INVOICE
        </Text>
      </View>
      <Table style={{ width: '180px' }}>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2 }}>Date</TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>14/09/2025</TD>
        </TR>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2 }}>Invoice Number</TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>14/09/2025</TD>
        </TR>
      </Table>
    </View>
  </View>
);

const InvoiceDetailSection = () => (
  <View style={styles.column}>
    <View
      style={{
        width: '70%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: '120px' }}>
        <Text style={{ fontSize: 8, textAlign: 'center' }}>EAGLEGREEN LLP</Text>
        <Text style={{ fontSize: 8, textAlign: 'center' }}>CRA 784223463 Ph</Text>
        <Text style={{ fontSize: 8, textAlign: 'center' }}>(236) 512-3524</Text>
      </View>
    </View>
    <View style={[styles.taxTableContainer, { width: '30%' }]}>
      <View style={{ width: '150px' }}>
        <Text style={{ fontSize: 8, textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
          Terms: 60 Days terms
        </Text>
        <Text style={{ fontSize: 8, textAlign: 'center' }}>and conditions apply</Text>
      </View>
    </View>
  </View>
);

const InvoiceAddressSection = () => (
  <View style={[styles.column, { alignItems: 'stretch' }]}>
    <View style={[styles.borderedContainer, { width: '340px', backgroundColor: '#e2e2e2' }]}>
      <Text style={{ fontSize: '8px' }}>Invoiced To</Text>
      <Text style={{ fontSize: '8px' }}> Eagle Green Traffic Control</Text>
      <Text style={{ fontSize: '8px' }}> 2145/955 Seaborne Avenue</Text>
      <Text style={{ fontSize: '8px' }}> Port Coquitlam BC V3B 8G8</Text>
    </View>

    <View style={{ width: '200px' }}>
      <Table style={{ width: '100%' }}>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2 }}>Ticket #</TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>4015</TD>
        </TR>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2 }}>Work Order Number</TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>N/A</TD>
        </TR>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2 }}>Purchase Order Number</TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>EG TEST</TD>
        </TR>
      </Table>
    </View>
  </View>
);

export default function InvoicePdf() {
  const toDayjs = (value?: string | Date | null) => dayjs(value);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ position: 'absolute', top: 0 }}>
          <Banner />
        </View>
        <View>
          <HeaderSection />
        </View>
        <View>
          <InvoiceDetailSection />
        </View>
        <View>
          <InvoiceAddressSection />
        </View>
        <View style={{ position: 'absolute', bottom: 0 }} fixed>
          <FooterBanner />
        </View>
      </Page>
    </Document>
  );
}
