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
});
type Props = {
  data: NewHire;
};
export function EmployeeEquityQuestionPage({ data }: Props) {
  const currentDate = dayjs();
  const { employee, equity_question } = data;
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
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 16 }]}>EMPLOYMENT EQUITY QUESTIONS</Text>
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
          }}
        >
          <Text style={[{ fontSize: 12 }]}>
            For the purpose of employment equity, please answer the following questions:
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>1. GENDER</Text>
          <Text style={[{ fontSize: 12 }]}>What is your Gender?</Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={employee.gender == 'male'} />
              <Text style={[{ fontSize: 12 }]}>MALE</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={employee.gender == 'female'} />
              <Text style={[{ fontSize: 12 }]}>FEMALE</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={employee.gender == 'other'} />
              <Text style={[{ fontSize: 12 }]}>PREFER NOT TO SAY</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>2. ABORIGINAL PERSONS</Text>
          <Text style={[{ fontSize: 12 }]}>
            Aboriginal peoples are those who identify as First Nations (Status, non-Status, Treaty),
            Metis, Inuit, or North American Indian.{' '}
            <Text style={styles.bold}> Do you consider yourself an Aboriginal person </Text>?
          </Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_aboriginal_person == 'yes'} />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_aboriginal_person == 'no'} />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>3. VISIBLE MINORITY</Text>
          <Text style={[{ fontSize: 12 }]}>
            Members of visible minorities are persons in Canada (other than Aboriginal peoples) who
            are non white, regardless of place of birth or citizenship.
            <Text style={styles.bold}> Do you self-identify as a visible minority </Text>?
          </Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_visible_minority == 'yes'} />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_visible_minority == 'no'} />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>OPTIONAL QUESTIONS</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[{ fontSize: 12 }]}>
            4. EG is dedicated to supporting social well-being in the communities in which we work.
            Would you be willing to participate in events that will help EG strengthen its
            commitment to diversity? If you choose to participate in certain events, Employee
            Services may ask you to attend and help. Your participation is voluntary.
          </Text>

          <Text style={[{ fontSize: 12 }]}>
            5. Some projects require members/ employees from a specific aboriginal nation to work on
            the project. Would you be interested in being considered for these opportunities?
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_participation_voluntary == 'yes'} />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox checked={equity_question.is_participation_voluntary == 'no'} />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>

          <Text style={[{ fontSize: 12 }]}>
            If yes, please tell us your Nation?{' '}
            {equity_question.is_participation_voluntary == 'yes' && (
              <Text> {equity_question.participation_voluntary_text} </Text>
            )}
          </Text>
        </View>
      </Page>
    </>
  );
}
