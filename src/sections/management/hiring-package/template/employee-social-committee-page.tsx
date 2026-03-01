import dayjs from 'dayjs';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { EmployeeInformation, SocialAgreement } from 'src/types/new-hire';

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
  textNormal: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100%',
    fontSize: 10,
  },
  bold: {
    fontFamily: 'Roboto-Bold',
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6, // half of width/height
  },
  emptyCircle: {
    borderWidth: 1,
    borderColor: '#000',
  },
  filledCircle: {
    backgroundColor: '#000',
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
  bulletPoint: {
    fontSize: 22,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
  },
});

type Props = {
  employee: EmployeeInformation;
  socialAgreement: SocialAgreement;
};
export function EmployeeSocialCommitteePage({ employee, socialAgreement }: Props) {
  const currentDate = dayjs();

  const Checkbox = ({ checked }: { checked?: boolean }) => (
    <View
      style={{
        width: 15,
        height: 15,
        border: '1pt solid black',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: 'black',
          }}
        />
      )}
    </View>
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={[styles.header.logo]}>
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
          gap: 30,
          marginTop: '20px',
        }}
      >
        <Text style={[styles.bold, { fontSize: 16 }]}>TO ALL EMPLOYEES:</Text>

        <Text style={[styles.bold, { fontSize: 16 }]}>Re: Employee Social Committee</Text>

        <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
          Welcome to Eagle Green LLP The Company has formed a committee of employees to manage
          social events that employees can enjoy throughout the year. This committee arranges and
          pays for all kinds of functions and fundraisers, such as barbeques, picnics, adopting a
          family at Christmas and the annual Christmas Party. This committee operates separately
          from the Company.
        </Text>

        <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular', textDecoration: 'underline' }]}>
          How does it work ?
        </Text>

        <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
          Employees contribute $1.00 per pay period, which is deducted from their weekly paycheque.
          The Company then matches that dollar amount each pay period. The committee meets and
          decides what functions will be organized and how the money in the social fund will be
          spent.
        </Text>

        <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
          We always need new employees to help plan and organize events, so if you are willing to
          join the Social Committee, please let us know!
        </Text>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            width: '100%',
          }}
        >
          <View>
            <Checkbox checked={socialAgreement.is_join_social_committee} />
          </View>
          <View style={{ width: '100%' }}>
            <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
              I would like to join the (EG) Employee Social Committee. My contact information is as
              follows: Name:{' '}
              <Text
                style={{ fontFamily: 'Roboto-Bold' }}
              >{`${employee.last_name}, ${employee.first_name}`}</Text>{' '}
              Phone: <Text style={{ fontFamily: 'Roboto-Bold' }}> {employee.cell_no}</Text>
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            width: '100%',
          }}
        >
          <View>
            <Checkbox checked={socialAgreement.authorize_deduction} />
          </View>
          <View style={{ width: '100%' }}>
            <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
              I authorize a deduction of $1.00 per pay period to go towards the Social Fund and
              become a member of the Social Club.
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            width: '100%',
          }}
        >
          <View>
            <Checkbox checked={socialAgreement.not_agree_deduction} />
          </View>
          <View style={{ width: '100%' }}>
            <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
              I do not agree to have money deductedfrom my paycheque and do not want to become a
              member of the Social Club.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 10,
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
              width: '250px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12 }}>{`${employee.last_name}, ${employee.first_name}`}</Text>
          </View>

          <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S NAME </Text>
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
              width: '250px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Image
              src={employee.signature as string}
              style={{
                maxWidth: 70,
                maxHeight: 70,
                objectFit: 'contain',
              }}
            />
          </View>

          <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE</Text>
        </View>
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
            width: '250px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12 }}>{currentDate.format('DD/MM/YYYY')}</Text>
        </View>

        <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>DATE </Text>
      </View>
    </Page>
  );
}
