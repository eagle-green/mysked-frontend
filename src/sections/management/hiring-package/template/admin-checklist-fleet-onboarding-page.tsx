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
export function AdminCheckListFleetOnboardingPage({ data }: Props) {
  const { fleet_checklist } = data;
  const Circle = ({
    content,
    isShaded = false,
    customText,
  }: {
    content: string;
    isShaded?: boolean;
    customText?: React.ReactNode;
  }) => (
    <View
      style={{
        marginTop: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        width: '100%',
      }}
    >
      <View style={[styles.circle, isShaded ? styles.filledCircle : styles.emptyCircle]} />
      <View style={{ fontSize: 12, width: '100%', padding: '0 5px' }}>
        {customText ? customText : <Text> {content}</Text>}
      </View>
    </View>
  );

  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '250px',
              flexWrap: 'wrap',
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 24 }]}>
              ADMIN CHECKLIST: FLEET ONBOARDING DOCUMENTATIONS
            </Text>
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
          <Text style={[styles.bold, { fontSize: 14, textDecoration: 'underline', color: 'red' }]}>
            ONLY TO BE COMPLETED IF EMPLOYEE IS REQUIRED TO USE A COMPANY VEHICLE
          </Text>
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
          <Text style={[{ fontSize: 12 }]}>
            EMPLOYEE NAME:{' '}
            <Text style={{ fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}>
              {data.contract_detail.employee_name}
            </Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            OPERATING AREA:
            <Text style={{ fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}>
              {data.contract_detail.area}
            </Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            HIRE DATE:{' '}
            <Text style={{ fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}>
              {data.contract_detail.hire_date}
            </Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            POSITION TITLE:{' '}
            <Text style={{ fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}>
              {data.contract_detail.position}
            </Text>
          </Text>
        </View>

        <View style={{ marginTop: 15, width: '80%' }}>
          <Circle
            content="Copy of Current Driver's License (NSC)"
            isShaded={fleet_checklist.current_driver_license}
          />
          <Circle
            content="Provincial Abstract Consent Form"
            isShaded={fleet_checklist.consent_form}
          />
          <Circle
            content="Copy of 5 Yr. Commercial Driver's Abstract"
            isShaded={fleet_checklist.commercial_driver_abstract}
          />
          <Circle content="Employee Resume" isShaded={fleet_checklist.employee_resume} />
          <Circle content="Drug & Alcohol Policy" isShaded={fleet_checklist.drug_alcohol_test} />
          <Circle content="Pre-Trip & Post-Trip Policy" isShaded={fleet_checklist.trip_policy} />
          <Circle
            content="EG Driver Identification Policy (Vehicle Fobs)"
            isShaded={fleet_checklist.identification_policy}
          />
          <Circle
            content="Use of Company Vehicle UNION Policy"
            isShaded={fleet_checklist.company_vehicle_union}
          />
          <Circle
            content="Use of Company Vehicle NON UNION Policy"
            isShaded={fleet_checklist.company_vehicle_non_union}
          />
          <Circle content="Company Fuel Cards Policy" isShaded={fleet_checklist.fuel_cards} />
          <Circle content="GPS Usage Policy" isShaded={fleet_checklist.usage_policy} />
          <Circle content="Conduct & Behavior Policy" isShaded={fleet_checklist.behavior_policy} />
          <Circle
            content="Additional Certifications (*Not Required, N/A if none provided)"
            isShaded={fleet_checklist.addtional_certification}
          />
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
          <Text style={[styles.bold, { fontSize: 12 }]}>
            Area Admin Confirmation of Documents Received
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
              <Text style={{ fontSize: 12 }}>{`${data.hr_manager.display_name}`}</Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>HIRING MANAGER`S NAME </Text>
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
                src={data.hr_manager.signature as string}
                style={{
                  maxWidth: 70,
                  maxHeight: 70,
                  objectFit: 'contain',
                }}
              />
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
              HIRING MANAGER`S SIGNATURE
            </Text>
          </View>
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
          <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
            Please Complete & Submit with Complete Hire Package to Payroll
          </Text>
          <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
            * National Safety Code Requirement
          </Text>
        </View>
      </Page>
    </>
  );
}
