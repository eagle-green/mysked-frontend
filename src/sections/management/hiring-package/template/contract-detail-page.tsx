import { Page, Text, View, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto-Bold',
  src: '/fonts/Roboto-Bold.ttf',
});

Font.register({
  family: 'Roboto-Regular',
  src: '/fonts/Roboto-Regular.ttf',
});

export function ContractDetailPage() {
  const Signature = ({ position }: { position: string }) => (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
      }}
    >
      <View
        style={{
          borderTop: '1px',
          padding: '5px 15px',
          width: '250px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10 }}>Printed Name of {position}</Text>
      </View>

      <View
        style={{
          borderTop: '1px',
          padding: '5px 15px',
          width: '250px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10 }}>Signature of {position}</Text>
      </View>
    </View>
  );

  const Description = ({
    header,
    content,
    additionalContent,
  }: {
    header: string;
    content: string;
    additionalContent?: string;
  }) => (
    <View
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexDirection: 'column',
        width: '100%',
        fontSize: 10,
      }}
    >
      <Text style={{ fontFamily: 'Roboto-Bold' }}>{header}</Text>
      <Text>{content}</Text>
      {additionalContent && <Text style={{ marginTop: 10 }}>{additionalContent}</Text>}
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
          <View style={{ fontSize: 14, fontFamily: 'Roboto-Bold' }}>
            <Text>Date: </Text>
            <Text>Name of Employee: </Text>
            <Text>
              Re:
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                Offer of Employment with Eagle Green LLP
              </Text>
            </Text>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>
            {`We are pleased to offer you a position with Eagle Green as ${'software engineer'}`}
          </Text>
        </View>

        <Description
          header="START DATE AND HOURS OF WORK."
          content={`Your start date is ${'01/30/2026'}. The average work week is up to 50 hours per week, Monday to Friday. We also work some Saturdays during peak season (generally April to September). You agree that you will attempt to make yourself available to work on weekends. Please note we follow all applicable provincial legislation on pay for overtime work.`}
        />

        <Description
          header="PAY AND BENEFITS."
          content={`Your hourly rate will be ${9} per hour, paid bi-weekly via direct deposit into your bank account. Vacation: Your vacation pay is accrued as follows: for B.C. – 4%, for A.B. and S.K. 6% Benefits: You are entitled to benefits once you have successfully completed 350 hours of work.`}
        />

        <Description
          header="PROBATIONARY PERIOD."
          content="Your first 180 working days are considered a probationary period. A written performance evaluation will be given to you after
                      150 working days. This probation period is used to assess new employees and to determine suitability for long-term
                      employment. Once you have passed probation, you will be considered a permanent member of Eagle Green LLP."
        />

        <Description
          header="TERMINATION OF EMPLOYMENT."
          content="If it is determined a fit does not exist for any reason during your probationary period, your employment may be terminated
                      immediately by the company. After completion of your probationary period, both the employee and the Company must give
                      notice in accordance with Provincial Employment Standards Legislation."
        />

        <Description
          header="PERSONAL INFORMATION."
          content="You consent to the Company or its agents collecting, using, disclosing, and retaining your personal information, including
                      health information, for the purpose of managing and administering the employment relationship."
        />

        <Description
          header="POLICIES."
          content="As an employee of Eagle GreenLLP, you agree to abide by its values, policies, and guidelines both verbal and in documented
                      form. If the policy is not clear, it is your responsibility to ask your supervisor for more information on clarification."
          additionalContent="All vehicles must be returned with all assigned equipment to the yard location designated by dispatch in clean working
                      condition with all equipment. Vehicle Subject to cleaning fee and Pick up fee if not returned to the yard location provided or
                      returned in a dirty manner. The cleaning Fee of $125 and the pick-up fee of $125 will be deducted from final pay. Other Fees
                      regarding lost items are as follows: Key - $250 and Gas Card - $25"
        />

        <Description
          header="DRIVERS LICENSE."
          content="You agree to hold and maintain a valid driver's license for the duration of your employment and to produce an abstract when
                      requested. You will agree to allow the company to acquire an abstract on your behalf, at its sole discretion."
        />

        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: '10' }}>
            Congratulations on your new role and thank you for investing your career with us.
          </Text>
          <Text style={{ fontSize: '10' }}>
            We look forward to a long and healthy working relationship with you.
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>Eagle Green LLP</Text>
        </View>

        <Signature position="Hiring Manager" />

        <Description
          header=""
          content="I hereby understand and accept the Company’s offer of employment and agree to the terms and conditions set out in this
                      agreement."
        />

        <Signature position="Employee" />

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
            Keep one copy for your own records and return the original to your supervisor.
          </Text>
        </View>
      </Page>
    </>
  );
}
