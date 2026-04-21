import type { NewHire } from 'src/types/new-hire';

import dayjs from 'dayjs';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { hasPdfImageSrc } from 'src/utils/safe-pdf-image-src';

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
  bulletPoint: {
    fontSize: 22,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
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

type Props = {
  data: NewHire;
};

export function EmployeeTaxCreditTD1BCPage({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');

  const { employee, contract_detail, claims_bc } = data;
  const td1bcSignature = claims_bc.td1bc_form_signature || '';
  contract_detail.employee_name = `${employee.last_name}, ${employee.first_name}`;
  contract_detail.employee_signature = employee.signature || '';
  contract_detail.date = dateNow;

  const claim_bc_amounts = {
    basic_claim_amount: claims_bc.basic_claim_amount,
    age_claim_amount: claims_bc.age_claim_amount,
    pension_claim_amount: claims_bc.pension_claim_amount,
    tuition_claim_amount: claims_bc.tuition_claim_amount,
    disability_claim_amount: claims_bc.disability_claim_amount,
    spouse_claim_amount: claims_bc.spouse_claim_amount,
    dependant_claim_amount: claims_bc.dependant_claim_amount,
    bc_caregiver_amount: claims_bc.bc_caregiver_amount,
    transfer_common_claim_amount: claims_bc.transfer_common_claim_amount,
    transfer_dependant_claim_amount: claims_bc.transfer_dependant_claim_amount,
  };

  const total_claims_bc = Object.values(claim_bc_amounts).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  const formatNumber = (value: string | number) => {
    if (value === null || value === undefined || value === '' || value == 0) return '';

    const num = Number(value);
    if (Number.isNaN(num)) return '';

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

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
      {/* Personal British Columbia Tax Credits Return  page 1 */}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
            }}
          >
            <Image src="/pdf/british-columbia-logo.png" style={{ width: 100, height: 30 }} />
          </View>

          <View
            style={{
              width: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              2026 British Columbia
            </Text>

            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              Personal Tax Credits Return
            </Text>
          </View>

          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flex: 1,
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed
            </Text>
            <Text>TD1BC </Text>
          </View>
        </View>

        <View style={{ width: '100%' }}>
          <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 9 }}>
            Read page 2 before filling out this form. Your employer or payer will use this form to
            determine the amount of provincial tax deductions.
          </Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 9 }}>
            Fill out this form based on the best estimate of your circumstances.
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            border: '1px solid #000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingBottom: '50px',
          }}
        >
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 8.5,
              height: 25,
              borderBottom: '1px solid #000'
            }}
          >
            <View style={{ borderRight: '1px solid #000', flex: 1, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Last name</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.last_name}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px solid #000', width: '100px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>First name and initial(s)</Text>
              <Text
                style={{ padding: '0 5px', textTransform: 'uppercase' }}
              >{`${employee.first_name}, ${employee.middle_initial}`}</Text>
            </View>
            <View
              style={{ borderRight: '1px solid #000', width: '120px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Date of birth (yyyy/mm/dd)</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {dayjs(employee.date_of_birth as string).format('MM/DD/YYYY')}
              </Text>
            </View>
            <View style={{ width: '150px' }}>
              <Text style={{ padding: '0 5px' }}>Employee Number</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.employee_number || ' '}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 8.5,
              height: 30,
              borderBottom: '1px solid #000'
            }}
          >
            <View style={{ borderRight: '1px solid #000', flex: 2, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Address</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.address}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px solid #000', width: '70px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Postal Code</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.postal_code}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px solid #000', width: '130px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px', fontSize: 8 }}>
                For non-residents only Country of permanent residence
              </Text>
            </View>
            <View style={{ width: '120px', height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Social insurance number</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.sin || ' '}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>1. Basic personal amount</Text> – Every
                person employed in British Columbia and every pensioner residing in British Columbia
                can claim this amount. If you will have more than one employer or payer at the same
                time in 2026, see “More than one employer or payer at the same time” on page 2.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.basic_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>2. Age amount</Text>– If you will be 65
                or older on December 31, 2026, and your net income will be $44,119 or less, enter
                $5,927. You may enter a partial amount if your net income for the year will be
                between $44,119 and $83,633. To calculate a partial amount, fill out the line 2
                section of Form TD1BC-WS, Worksheet for the 2026 British Columbia Personal Tax
                Credits Return.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims_bc.age_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>3. Pension income amount</Text>– If you
                will receive regular pension payments from a pension plan or fund (not including
                Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
                supplement payments), enter whichever is less: $1,000 or your estimated annual
                pension.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.pension_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  4. Tuition (full-time and part-time)
                </Text>
                – Fill out this section if you are a student at a university, college, or
                educational institution certified by Employment and Social Development Canada, and
                you will pay more than $100 per institution in tuition fees. Enter your total
                tuition fees that you will pay less your Canada Training Credit if you are a
                full-time or part-time student.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.tuition_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>5. Disability amount</Text>– If you will
                claim the disability amount on your income tax and benefit return by using Form
                T2201, Disability Tax Credit Certificate, enter $9,913.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.disability_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  6. Spouse or common-law partner amount
                </Text>
                – Enter $11,317 if you are supporting your spouse or common-law partner and both of
                the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner has a net income of $1,132 or less for the year
              </Text>
              <Text>
                You may enter a partial amount if your spouse`s or common-law partner`s net income
                for the year will be between $1,132 and $12,449. To calculate a partial amount, fill
                out the line 6 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.spouse_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  7. Amount for an eligible dependant
                </Text>
                – Enter $11,317 if you are supporting an eligible dependant and all of the following
                conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You do not have a spouse or common-law partner, or you have a spouse or common-law
                partner who does not live with you and who you are not supporting or being supported
                by
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant is related to you and lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant has a net income of $1,132 or less for the year
              </Text>
              <Text>
                You may enter a partial amount if the eligible dependant’s net income for the year
                will be between $1,132 and $12,449. To calculate a partial amount, fill out the line
                7 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.dependant_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  8. British Columbia caregiver amount
                </Text>
                – You may claim this amount if you are supporting your infirm spouse or common-law
                partner, or an infirm eligible dependant (age 18 or older) who is your or your
                spouse`s or common-law partner`s:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • child or grandchild (including those of your spouse or common-law partner)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • parent, grandparent, brother, sister, uncle, aunt, niece, or nephew who resides in
                Canada at any time in the year (including those of your spouse or common-law
                partner)
              </Text>
              <Text>
                The infirm person`s net income for the year must be less than $25,356. To calculate
                this amount, fill out the line 8 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.bc_caregiver_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  9. Amounts transferred from your spouse or common-law partner
                </Text>
                – If your spouse or common-law partner will not use all of their age amount, pension
                income amount, tuition amount, or disability amount on their income tax and benefit
                return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.transfer_common_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  10. Amounts transferred from a dependant
                </Text>
                – If your dependant will not use all of their disability amount on their income tax
                and benefit return, enter the unused amount. If your or your spouse’s or common-law
                partner’s dependent child or grandchild will not use all of their tuition amount on
                their income tax and benefit return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {' '}
                {formatNumber(claims_bc.transfer_dependant_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px solid #000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>11. TOTAL CLAIM AMOUNT</Text>– Add lines
                1 to 10. Your employer or payer will use this amount to determine the amount of your
                provincial tax deductions.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px solid #000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(total_claims_bc)}</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
          }}
        >
          <View style={{ flex: 1, fontSize: 8 }}>
            <Text> TD1BC E (26)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8 }}>
            <Text> (Ce formulaire est disponible en francais)</Text>
          </View>

          <View
            style={{
              flex: 1,
              fontSize: 8,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              gap: 15,
            }}
          >
            <Text> Page 1 of 2 </Text>
            <Image src="/pdf/canada-tax-logo.png" style={{ width: 80, height: 25 }} />
          </View>
        </View>
      </Page>

      {/* Personal British Columbia Tax Credits Return  page 2 */}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 5,
          }}
        >
          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed
            </Text>
          </View>
        </View>
        <View
          style={{
            width: '100%',
            border: '1px solid #000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '10px 5px',
              borderBottom: '1px solid #000',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Filling out Form TD1BC</Text>
              </Text>
              <Text>
                Fill out this form if you have income in British Columbia and any of the following
                apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • you have a new employer or payer, and you will receive salary, wages, commissions,
                pensions, employment insurance benefits, or any other remuneration
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • you want to change the amounts you previously claimed (for example, the number of
                your eligible dependants has changed)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • you want to increase the amount of tax deducted at source
              </Text>
              <Text>Sign and date it, and give it to your employer or payer.</Text>
              <Text>
                If you do not fill out Form TD1BC, your employer or payer will deduct taxes after
                allowing the basic personal amount only.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
              borderBottom: '1px solid #000',
            }}
          >
            <View
              style={{
                width: '100%',
              }}
            >
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  More than one employer or payer at the same time
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox checked={claims_bc.has_two_employeer} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    If you have more than one employer or payer at the same time and you have
                    already claimed personal tax credit amounts on another Form TD1BC for 2026, you
                    cannot claim them again. If your total income from all sources will be more than
                    the personal tax credits you claimed on another Form TD1BC, check this box,
                    enter “0” on line 11 and do not fill in lines 2 to 10.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
              borderBottom: '1px solid #000',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Total income is less than the total claim amount
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox checked={claims_bc.not_eligible} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    Tick this box if your total income for the year from all employers and payers
                    will be less than your total claim amount on line 11. Your employer or payer
                    will not deduct tax from your earnings.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
              borderBottom: '1px solid #000',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Additional tax to be deducted</Text>
              </Text>
              <Text>
                If you want to have more tax deducted at source, fill out section{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>“Additional tax to be deducted”</Text>{' '}
                on the federal Form TD1.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
              borderBottom: '1px solid #000',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Reduction in tax deductions</Text>
              </Text>
              <Text>
                You may ask to have less tax deducted at source if you are eligible for deductions
                or non-refundable tax credits that are not listed on this form (for example,
                periodic contributions to a registered retirement savings plan (RRSP), child care or
                employment expenses, charitable donations, and tuition and education amounts carried
                forward from the previous year). To make this request, fill out Form T1213, Request
                to Reduce Tax Deductions at Source, to get a letter of authority from your tax
                services office. Give the letter of authority to your employer or payer. You do not
                need a letter of authority if your employer deducts RRSP contributions from your
                salary.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Forms and publications</Text>
              </Text>
              <Text>
                To get our forms and publications, go to
                <Text
                  style={{ fontFamily: 'Roboto-Bold', textDecoration: 'underline', color: 'blue' }}
                >
                  canada.ca/cra-forms-publications
                </Text>
                or call <Text style={{ fontFamily: 'Roboto-Bold' }}>1-800-959-5525</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 9 }}>
          Personal information (including the SIN) is collected and used to administer or enforce
          the Income Tax Act and related programs and activities including administering tax,
          benefits, audit, compliance, and collection. The information collected may be disclosed to
          other federal, provincial, territorial, aboriginal or foreign government institutions to
          the extent authorized by law. Failure to provide this information may result in paying
          interest or penalties, or in other actions. Under the Privacy Act, individuals have a
          right of protection, access to and correction of their personal information, and to file a
          complaint with the Privacy Commissioner of Canada regarding the handling of their personal
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source at
          <Text style={{ fontFamily: 'Roboto-Bold', textDecoration: 'underline', color: 'blue' }}>
            canada.ca/cra-info-source
          </Text>
          .
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5,
            border: '1px solid #000',
            fontSize: 9,
            width: '100%',
            padding: 5,
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Bold' }}>Certification</Text>
          <Text>I certify that the information given on this form is correct and complete.</Text>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginTop: 10,
            }}
          >
            <Text style={{ width: '50px' }}>Signature</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flex: 2,
              }}
            >
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  borderBottom: '1px solid #000',
                }}
              >
                {hasPdfImageSrc(td1bcSignature) ? (
                  <Image
                    src={td1bcSignature}
                    style={{
                      maxWidth: 70,
                      maxHeight: 70,
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <View style={{ minHeight: 28, width: '100%' }} />
                )}
              </View>
              <Text style={{ width: '100%', textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
                It is a serious offence to make a false return.
              </Text>
            </View>
            <Text style={{ width: '40px', flexShrink: 0 }}>Date</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  borderBottom: '1px solid #000',
                  paddingBottom: '12px',
                }}
              >
                <Text
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: 'Roboto-Bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {dateNow}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
          }}
        >
          <View style={{ flex: 1, fontSize: 8, textAlign: 'left' }}>
            <Text> TD1BC E (26)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
            <Text>Page 2 of 2</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
