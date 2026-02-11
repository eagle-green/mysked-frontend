import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

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
    padding: '0 30px 10px 30px',
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 30,
    width: '100%',
    flexDirection: 'row',
    logo: {
      width: 150,
      hieght: 150,
    },
    detail: {},
  },
  textHeader: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
  },
  bold: {
    fontFamily: 'Roboto-Bold',
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
    fontFamily: 'Roboto-Bold',
    fontSize: 9,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: '30px',
    padding: '2px',
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
});

export function EquipmentReturnPolicyPage() {
  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>EQUIPMENT RETURN</Text>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>POLICY FORM</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE INFORMATION</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            gap: 5,
          }}
        >
          <Text style={[{ fontSize: 10 }]}>DATE:</Text>
          <Text style={[{ fontSize: 10 }]}>NAME OF EMPLOYEE:</Text>
          <Text style={[{ fontSize: 10 }]}>ADDRESS:</Text>
          <Text style={[{ fontSize: 10 }]}>CITY:</Text>
          <Text style={[{ fontSize: 10 }]}>PROVINCE:</Text>
          <Text style={[{ fontSize: 10 }]}>COUNTRY:</Text>
          <Text style={[{ fontSize: 10 }]}>POSTAL CODE:</Text>
          <Text style={[{ fontSize: 10 }]}>PHONE:</Text>
          <Text style={[{ fontSize: 10 }]}>EMAIL:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>LIST OF ITEMS GIVEN TO THE EMPLOYEE:</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            marginTop: '10',
            gap: 10,
          }}
        >
          <Text style={[{ fontSize: 10 }]}>
            By signing this form, you acknowledge agree to the following terms
          </Text>
          <Text style={[{ fontSize: 10 }]}>
            Price to be deducted off the first pay period as follows.
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              gap: 10,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Hard Hat:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$45.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Safety Vest:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$35.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Ankle & Wrist Bands:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$15.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Safety Paddle:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$60.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Light Wand: </Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$20.00</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <Text style={[{ fontSize: 10 }]}>
            If you have any question regarding this, please contact us at info@eaglegreen.ca.
          </Text>
          <Text style={[{ fontSize: 10 }]}>Dated:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 30,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
              AUTHORIZED PERSON’S SIGNATURE{' '}
            </Text>
          </View>
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 10,
            width: '80%',
            marginTop: '10px',
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={[{ fontSize: 10, flex: 1 }]}>info@eaglegreen.ca</Text>
            <Text style={[{ fontSize: 10, flex: 1 }]}>+1 (236)591-0956</Text>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={[{ fontSize: 10, flex: 1 }]}>www.eaglegreen.ca</Text>
            <Text style={[{ fontSize: 10, flex: 1 }]}>955 Seaborne Avenue, Port Coquitlam, BC</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
