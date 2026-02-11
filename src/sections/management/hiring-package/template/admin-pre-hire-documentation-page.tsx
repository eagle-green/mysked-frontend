import { Page, Text, View, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto-Bold',
  src: '/fonts/Roboto-Bold.ttf',
});

Font.register({
  family: 'Roboto-Regular',
  src: '/fonts/Roboto-Regular.ttf',
});

export function AdminPreHireOnboardingDocumentationPage() {
  const isCheck = true;
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
        gap: 20,
        width: '100%',
      }}
    >
      <View
        style={[
          {
            width: 12,
            height: 12,
            borderRadius: 6,
          },
          isShaded
            ? {
                backgroundColor: '#000',
              }
            : {
                borderWidth: 1,
                borderColor: '#000',
              },
        ]}
      />
      <View style={{ fontSize: 12, width: '100%', padding: '0 5px' }}>
        {customText ? customText : <Text> {content}</Text>}
      </View>
    </View>
  );
  return (
    <>
      <Page
        size="A4"
        style={{
          padding: '0 30px 10px 30px',
          fontFamily: 'Roboto-Regular',
          backgroundColor: '#ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10,
          position: 'relative',
        }}
      >
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 30,
            width: '100%',
            flexDirection: 'row',
          }}
        >
          <View style={{ width: 150, height: 150 }}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontFamily: 'Roboto-Bold',
            }}
          >
            <Text>ADMIN PRE-HIRE & ONBOARDING</Text>
            <Text>DOCUMENTATION FOR BRITISH COLUMBIA</Text>
          </View>
        </View>

        <View style={{ display: 'flex', alignItems: 'flex-start', width: '90%' }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={{ flex: 1, fontSize: 14 }}>Name:</Text>
            <Text style={{ flex: 1, fontSize: 14 }}>Position:</Text>
          </View>

          <View style={{ marginTop: 15 }}>
            <Circle
              content="Pre-Access Drug & Alcohol Test Completed and Passed"
              isShaded={isCheck}
            />
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'Roboto-Bold' }}>
              Admin Onboard Documentation
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'Roboto-Regular' }}>
              All new hires must complete the following forms:
            </Text>
          </View>

          <View style={{ marginTop: 15 }}>
            <Circle content="Offer of Employment – Hiring Manager to complete" />
            <Circle content="Offer Letter – Non Union" />
            <Circle content="New Hire – Rehire Employee Form" />
            <Circle content="Employee Emergency/Consent Information Sheet" />
            <Circle content="Equipment Form" />
            <Circle content="Direct Deposit Authorization" />
            <Circle content="Federal TD1" />
            <Circle content="Provincial TD1" />
            <Circle content="Social Fund" />
            <Circle content="EG Health and Safety Manual" />
            <Circle content="Celebrate Diversity at - EG" />
            <Circle content="Vacation – Non-Union – Employee to Keep" />
            <Circle content="Handbook – Acknowledgment of Receipt" />
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 30,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'Roboto-Bold' }}>
              Admin Onboard Documentation
            </Text>
          </View>

          <Circle
            content="Fleet Forms – See requiredfleet documentation checklist"
            isShaded={isCheck}
          />

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: 'red', fontFamily: 'Roboto-Bold' }}>
              Only To Be Completed If Employee Is Required To Use Company Vehicle
            </Text>
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
              <Text style={{ fontSize: 10 }}>Employee’s Signature</Text>
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
              <Text style={{ fontSize: 10 }}>Hiring Manager’s Signature</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: 'red', fontFamily: 'Roboto-Bold' }}>
              Please Complete & Submit with Complete Hire Package to Payroll
            </Text>
          </View>
        </View>
      </Page>
    </>
  );
}
