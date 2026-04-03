import dayjs from 'dayjs';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { NewHire } from 'src/types/new-hire';

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
});
type Props = {
  data: NewHire;
};
export function PayrollDirectDepositPage({ data }: Props) {
  const letter: string[] = data.payroll_deposit.payroll_deposit_letter
    ? JSON.parse(data.payroll_deposit.payroll_deposit_letter)
    : [];
  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={[styles.header.logo, { width: 200 }]}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 5,
                width: '100px',
              }}
            >
              <Text style={[{ fontSize: 10 }]}>info@eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>+1 (236)591-0956</Text>
              <Text style={[{ fontSize: 10 }]}>www.eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>955 Seaborne Avenue, Port Coquitlam, BC</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '70px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>PAYROLL DIRECT DEPOSIT</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '40px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16, textTransform: 'uppercase' }]}>
            EMPLOYEE’S NAME: {`${data.employee.first_name}, ${data.employee.last_name}`}
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          {letter.length ? (
            <Image
              src={letter[0]}
              style={{
                maxWidth: 400,
                maxHeight: 350,
                objectFit: 'contain',
              }}
            />
          ) : (
            <>
              <Text style={[styles.bold, { fontSize: 20 }]}>
                ***PLEASE ATTACH A VOID CHEQUE OR A
              </Text>
              <Text style={[styles.bold, { fontSize: 20 }]}>
                *DIRECT DEPOSIT LETTER FROM YOUR BANK***
              </Text>
            </>
          )}
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '40px',
          }}
        >
          <Text style={[{ fontSize: 16, fontFamily: 'Roboto-Regular' }]}>
            You must submit one of these two documents in order for your payroll to be processed.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <View
            style={{
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                borderBottom: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Image
                src={data.employee.signature}
                style={{
                  maxWidth: 70,
                  maxHeight: 70,
                  objectFit: 'contain',
                }}
              />
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>

          <View
            style={{
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                borderBottom: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
                {dayjs().format('DD/MM/YYYY')}
              </Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>Date</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
