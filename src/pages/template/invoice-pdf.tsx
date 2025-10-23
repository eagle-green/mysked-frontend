import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import {
  Page,
  Text,
  View,
  Font,
  Image,
  Document,
  StyleSheet,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    logo: {
      width: 85,
      hieght: 85,
    },
  },
  taxTableContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  table: {
    border: 'none',
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
    border: '1px solid #818285',
  },
  th: {
    height: 25,
    padding: '1px 2px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'baseline',
    border: '1px solid #818285',
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
    border: '1px solid #818285',
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
  <View style={[styles.header, { width: '550px' }]}>
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
      }}
    >
      <View style={{ width: '90px' }}>
        <Image style={styles.header.logo} src="/logo/eaglegreen-single.png" />
      </View>

      <View
        style={{
          width: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 5,
        }}
      >
        <Text style={{ fontSize: 12, textAlign: 'left', fontFamily: 'Roboto-Bold' }}>
          EAGLEGREEN LLP
        </Text>
        <Text style={{ fontSize: 10, textAlign: 'left', color: '#818285' }}>CRA 784223463 Ph</Text>
        <Text style={{ fontSize: 10, textAlign: 'left', color: '#818285' }}>(236) 512-3524</Text>
      </View>
    </View>
    <View style={[styles.taxTableContainer]}>
      <View style={{ width: '180px' }}>
        <Text style={{ fontSize: 12, textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
          TAX INVOICE
        </Text>
      </View>
      <View style={{ width: '180px' }}>
        <Table style={{ width: '100%' }}>
          <TH style={styles.tableHeaderColored}>
            <TD style={{ justifyContent: 'center', padding: 2, borderColor: '#818285' }}>Date</TD>
            <TD
              style={{
                justifyContent: 'center',
                padding: 2,
                backgroundColor: '#fff',
                borderColor: '#818285',
              }}
            >
              14/09/2025
            </TD>
          </TH>
          <TR>
            <TD
              style={[
                styles.td,
                {
                  flex: 1,
                  padding: 2,
                  justifyContent: 'center',
                  backgroundColor: '#e6e6e6',
                  borderColor: '#818285',
                },
              ]}
            >
              Invoice Number
            </TD>
            <TD
              style={[
                styles.td,
                { flex: 1, padding: 2, justifyContent: 'center', borderColor: '#818285' },
              ]}
            >
              INV-0001
            </TD>
          </TR>
        </Table>
      </View>
    </View>
  </View>
);

const InvoiceAddressSection = () => (
  <View style={[styles.column, { alignItems: 'stretch', width: '550px' }]}>
    <View style={[styles.borderedContainer, { width: '300px' }]}>
      <Text style={{ fontSize: '12px', backgroundColor: '#e2e2e2', padding: '2px' }}>
        Invoiced To
      </Text>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: 3,
          padding: 1,
        }}
      >
        <Text style={{ fontSize: '10px', fontFamily: 'Roboto-Bold' }}>
          Eagle Green Traffic Control
        </Text>
        <Text style={{ fontSize: '10px' }}>2145/955 Seaborne Avenue</Text>
        <Text style={{ fontSize: '10px' }}>Port Coquitlam BC V3B 8G8</Text>
      </View>
    </View>

    <View style={{ width: '250px' }}>
      <View
        style={{ width: '100%', padding: '12px', border: '1px solid #818285', marginBottom: '5px' }}
      >
        <Text style={{ fontSize: 10, textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
          Terms: 60 Days
        </Text>
        <Text style={{ fontSize: 10, textAlign: 'center', color: '#818285' }}>
          terms and conditions apply
        </Text>
      </View>

      <Table style={{ width: '100%' }}>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'center', padding: 2, borderColor: '#818285' }}>Ticket #</TD>
          <TD
            style={{
              justifyContent: 'center',
              padding: 2,
              backgroundColor: '#fff',
              borderColor: '#818285',
            }}
          >
            4015
          </TD>
        </TH>
        <TR>
          <TD
            style={[
              styles.td,
              { flex: 1, padding: 2, justifyContent: 'center', backgroundColor: '#e6e6e6' },
            ]}
          >
            Work Order Number
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>N/A</TD>
        </TR>
        <TR>
          <TD
            style={[
              styles.td,
              { flex: 1, padding: 2, justifyContent: 'center', backgroundColor: '#e6e6e6' },
            ]}
          >
            Purchase Order Number
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'center' }]}>EG TEST</TD>
        </TR>
      </Table>
    </View>
  </View>
);

const InvoiceItemSection = () => (
  <View style={{ width: '550px' }}>
    <Table style={{ width: '100%' }}>
      <TH style={styles.tableHeaderColored}>
        <TD style={{ flex: 3, justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          19/09/25 Ticket # 4015
        </TD>
        <TD style={{ flex: 1, justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          Qty
        </TD>
        <TD style={{ flex: 1, justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          Price
        </TD>
        <TD style={{ flex: 1, justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          Tax
        </TD>
        <TD style={{ flex: 1, justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          Total(ex. Tax)
        </TD>
      </TH>
      <TH style={styles.tableHeaderColored}>
        <TD style={{ justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          Purchase Order # EG TEST
        </TD>
      </TH>
      <TH style={styles.tableHeaderColored}>
        <TD style={{ justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
          955 Seaborne Avenue, Port Coquitlam BC V3E 3G7 Canda
        </TD>
      </TH>
      <TR>
        <TD style={[styles.td, { flex: 3, padding: 2, justifyContent: 'flex-start' }]}>
          Mobilization
        </TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>1.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>70.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>$3.50</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>70.00</TD>
      </TR>

      <TR>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
          08:30-19:30
        </TD>
      </TR>

      <TR>
        <TD style={[styles.td, { flex: 3, padding: 2, justifyContent: 'flex-start' }]}>
          1 LCT Day
        </TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>8.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>70.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>$28.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>560.00</TD>
      </TR>

      <TR>
        <TD style={[styles.td, { flex: 3, padding: 2, justifyContent: 'flex-start' }]}>
          1 LCT Weekday OT
        </TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>3.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>90.00</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>$13.50</TD>
        <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>270.00</TD>
      </TR>
    </Table>
  </View>
);

const AuthorizeSection = () => (
  <View style={[styles.borderedContainer, { width: '550px' }]}>
    <Text style={{ fontSize: '10px', backgroundColor: '#e2e2e2', padding: '2px' }}>
      Authorised By:
    </Text>
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 3,
        padding: 1,
      }}
    >
      <Text style={{ fontSize: '10px', fontFamily: 'Roboto-Bold' }}>Kesia Mae Pedalino</Text>
      <Text style={{ fontSize: '10px' }}>12365123524</Text>
    </View>
  </View>
);

const SubTotalSection = () => (
  <View
    style={{
      width: '550px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    }}
  >
    <View
      style={{
        width: '275px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        border: '1px solid #818285',
      }}
    >
      <Text style={{ fontSize: '10px', padding: '2px' }}>Please make cheques payable to:</Text>
      <Text style={{ fontSize: '10px', padding: '2px', fontFamily: 'Roboto-Bold' }}>
        EAGLEGREEN LLP
      </Text>
      <Text style={{ fontSize: '10px', padding: '2px' }}>or EFT to A/C</Text>
    </View>

    <View style={{ width: '270px' }}>
      <Table style={{ width: '100%' }}>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
            Sub Total
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
            $900.00
          </TD>
        </TR>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
            GST(5.0%)
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>$45.00</TD>
        </TR>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'flex-end', padding: 2, borderColor: '#818285' }}>
            Invoice Total
          </TD>
          <TD
            style={{
              justifyContent: 'flex-end',
              padding: 2,
              borderColor: '#818285',
            }}
          >
            $945.00
          </TD>
        </TH>
      </Table>
    </View>
  </View>
);

const RemittanceAdviceSection = () => (
  <View
    style={{
      width: '550px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    }}
  >
    <View
      style={{
        width: '275px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        border: '1px solid #818285',
      }}
    >
      <Text style={{ fontSize: '9px', padding: '2px', fontFamily: 'Roboto-Bold' }}>
        Remittance Advice To:
      </Text>
      <Text style={{ fontSize: '8px', padding: '2px' }}>EAGLEGREEN LLP</Text>
      <Text style={{ fontSize: '8px', padding: '2px' }}>
        Mailing Address: #2145 955Seaborne Avenue, Port Coquitlam BC V3E 3G7 Canada
      </Text>
      <Text style={{ fontSize: '8px', padding: '2px' }}> Email: accounting@eaglegreen.ca</Text>
    </View>

    <View style={{ width: '275px' }}>
      <Table style={{ width: '100%' }}>
        <TH style={styles.tableHeaderColored}>
          <TD style={{ justifyContent: 'flex-start', padding: 2, borderColor: '#818285' }}>
            Invoice Total
          </TD>
          <TD
            style={{
              justifyContent: 'flex-end',
              padding: 2,
              borderColor: '#818285',
            }}
          >
            $945.00
          </TD>
        </TH>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
            Invoice Number
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>INV-0001</TD>
        </TR>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>Date</TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>
            October 10, 2025
          </TD>
        </TR>
        <TR>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-start' }]}>
            Client Name
          </TD>
          <TD style={[styles.td, { flex: 1, padding: 2, justifyContent: 'flex-end' }]}>EG TEST</TD>
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
        <View style={{ marginTop: '5px' }}>
          <InvoiceAddressSection />
        </View>
        <View>
          <InvoiceItemSection />
        </View>
        <View>
          <AuthorizeSection />
        </View>
        <View>
          <SubTotalSection />
        </View>
        <View>
          <View
            style={{
              border: '1px dashed #818285',
              width: '550px',
              marginBottom: '10px',
            }}
          />
          <RemittanceAdviceSection />
        </View>
        <View style={{ position: 'absolute', bottom: 0 }} fixed>
          <FooterBanner />
        </View>
      </Page>
    </Document>
  );
}
