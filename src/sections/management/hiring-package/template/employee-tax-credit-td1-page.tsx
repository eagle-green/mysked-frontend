import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
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

type PolicyHeaderType = {
  PolicyNo: string;
  title: string;
  subjectArea: string;
  RevNo: string;
  pageNumber: number;
  pages?: number;
};

export function EmployeeTaxCreditTD1Page({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');

  const { employee, contract_detail, claims, claims_bc } = data;
  contract_detail.employee_name = `${employee.last_name}, ${employee.first_name}`;
  contract_detail.employee_signature = employee.signature || '';
  contract_detail.date = dateNow;

  const claim_amounts = {
    basic_claim_amount: claims.basic_claim_amount,
    parent_claim_amount: claims.parent_claim_amount,
    age_claim_amount: claims.age_claim_amount,
    pension_claim_amount: claims.pension_claim_amount,
    tuition_claim_amount: claims.tuition_claim_amount,
    disability_claim_amount: claims.disability_claim_amount,
    spouse_claim_amount: claims.spouse_claim_amount,
    dependant_claim_amount: claims.dependant_claim_amount,
    infirm_dependent_claim_amount: claims.infirm_dependent_claim_amount,
    transfer_common_claim_amount: claims.transfer_common_claim_amount,
    transfer_partner_claim_amount: claims.transfer_partner_claim_amount,
    dependent_common_claim_amount: claims.dependent_common_claim_amount,
  };

  const total_claims = Object.values(claim_amounts).reduce(
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
      {/* Personal Tax Credits Return  page 1*/}
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
            <Image src="/pdf/personal-tax-return-logo.png" style={{ width: 30, height: 25 }} />
            <Text style={{ fontSize: 8, width: 65 }}>Canada Revenue Agency</Text>
            <Text style={{ fontSize: 8, width: 65 }}>Agence de revenu du Canada</Text>
          </View>

          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              2026 Personal Tax Credit Return
            </Text>
          </View>

          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '120px',
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed{' '}
            </Text>
            <Text>TD1 </Text>
          </View>
        </View>

        <View style={{ width: '100%', fontSize: 9, fontFamily: 'Roboto-Regular' }}>
          <Text style={{ fontFamily: 'Roboto-Bold' }}>
            Read page 2 before filling out this form. Your employer or payer will use this form to
            determine the amount of your tax deductions.
          </Text>
          <Text>Fill out this form based on the best estimate of your circumstances.</Text>
          <Text>
            If you do not fill out this form, your tax deductions will only include the basic
            personal amount, estimated by your employer or payer based on the income they pay you.
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingBottom: '30px',
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
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Last name</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.last_name}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '100px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>First name and initial(s)</Text>
              <Text
                style={{ padding: '0 5px', textTransform: 'uppercase' }}
              >{`${employee.first_name}, ${employee.middle_initial}`}</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '120px', height: '100%' }}
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
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 2, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Address</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.address}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '70px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Postal Code</Text>
              <Text style={{ padding: '0 5px', textTransform: 'uppercase' }}>
                {employee.postal_code}
              </Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '130px', height: '100%' }}
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
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>1. Basic personal amount</Text> – Every
                resident of Canada can enter a basic personal amount of $16,129. However, if your
                net income from all sources will be greater than $177,882 and you enter $16,129, you
                may have an amount owing on your income tax and benefit return at the end of the tax
                year. If your income from all sources will be greater than $177,882 you have the
                option to calculate a partial claim. To do so, fill in the appropriate section of
                Form TD1-WS, Worksheet for the 2026 Personal Tax Credits Return, and enter the
                calculated amount here.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.basic_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  2. Canada caregiver amount for infirm children under age 18
                </Text>
                – Only one parent may claim $2,687 for each infirm child born in 2008 or later who
                lives with both parents throughout the year. If the child does not live with both
                parents throughout the year, the parent who has the right to claim the “Amount for
                an eligible dependant” on line 8 may also claim the Canada caregiver amount for the
                child.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.parent_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>3. Age amount</Text>– If you will be 65
                or older on December 31, 2026, and your net income for the year from all sources
                will be $45,522 or less, enter $9,028. You may enter a partial amount if your net
                income for the year will be between $45,522 and $105,709. To calculate a partial
                amount, fill out the line 3 section of Form TD1-WS.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.age_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>4. Pension income amount</Text>– If you
                will receive regular pension payments from a pension plan or fund (not including
                Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
                supplement payments), enter whichever is less: $2,000 or your estimated annual
                pension income.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.pension_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  5. Tuition (full-time and part-time)
                </Text>
                – Fill in this section if you are a student at a university or college, or an
                educational institution certified by Employment and Social Development Canada, and
                you will pay more than $100 per institution in tuition fees. Enter the total tuition
                fees that you will pay if you are a full-time or part-time student.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.tuition_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>6. Disability amount</Text>– If you will
                claim the disability amount on your income tax and benefit return by using Form
                T2201, Disability Tax Credit Certificate, enter $10,138.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {formatNumber(claims.disability_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  7. Spouse or common-law partner amount
                </Text>
                – Enter the difference between the amount on line 1 (line 1 plus $2,687 if your
                spouse or common-law partner is infirm) and your spouse`s or common-law partner`s
                estimated net income for the year if two of the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You are supporting your spouse or common-law partner who lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner`s net income for the year will be less than the
                amount on line 1 (line 1 plus $2,687 if your spouse or common-law partner is infirm)
              </Text>
              <Text>
                In all cases, go to line 9 if your spouse or common-law partner is infirm and has a
                net income for the year of $28,798 or less.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}> {formatNumber(claims.spouse_claim_amount)}</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  8. Amount for an eligible dependant
                </Text>
                – Enter the difference between the amount on line 1 (line 1 plus $2,687 if your
                eligible dependant is infirm) and your eligible dependant’s estimated net income for
                the year if all of the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You do not have a spouse or common-law partner, or you have a spouse or common-law
                partner who does not live with you and who you are not supporting or being supported
                by
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You are supporting the dependant who is related to you and lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant’s net income for the year will be less than the amount on line 1
                (line 1 plus $2,687 if your dependant is infirm)
              </Text>
              <Text>
                In all cases, go to line 9 if your dependant is 18 years or older, infirm, and has a
                net income for the year of $28,798 or less.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
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
                {formatNumber(claims.dependant_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  9. Canada caregiver amount for eligible dependant or spouse or common-law partner
                </Text>
                – Fill out this section if, at any time in the year, you support an infirm eligible
                dependant (aged 18 or older) or an infirm spouse or common-law partner whose net
                income for the year will be $28,798 or less. To calculate this amount you may enter
                here, fill out the line 9 section of Form TD1-WS.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {formatNumber(claims.dependent_common_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  10. Canada caregiver amount for dependant(s) age 18 or older
                </Text>
                – If, at any time in the year, you support an infirm dependant age 18 or older
                (other than the spouse or common-law partner or eligible dependant you claimed an
                amount on line 9 or could have claimed an amount for if their net income were under
                $18,816) whose net income for the year is $8,601, or may enter a partial amount if
                their net income for the year is between $20,197 and $28,798. To calculate a partial
                amount, fill out the line 10 section of Form TD1-WS. This worksheet may also be used
                to calculate your part of the amount if you are sharing it with another caregiver
                who supports the same dependant. You may claim this amount for more than one infirm
                dependant age 18 or older.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {formatNumber(claims.transfer_common_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  11. Amounts transferred from your spouse or common-law partner
                </Text>
                – If your spouse or common-law partner will not use all of their age amount, pension
                income amount, tuition amount, or disability amount on their income tax and benefit
                return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {formatNumber(claims.transfer_partner_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  12. Amounts transferred from a dependant
                </Text>
                – If your dependant will not use all of their disability amount on their income tax
                and benefit return, enter the unused amount. If your or your spouse’s or common-law
                partner’s dependant child or grandchild will not use all of their tuition amount on
                their income tax and benefit return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>
                {formatNumber(claims.infirm_dependent_claim_amount)}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>13. TOTAL CLAIM AMOUNT</Text>– Add lines
                1 to 12. Your employer or payer will use this amount to determine the amount of your
                tax deductions.
              </Text>
            </View>
            <View
              style={{
                borderBottom: '1px',
                borderColor: '#000',
                width: '80px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ padding: '0 5px' }}>{formatNumber(total_claims)}</Text>
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
            fontSize: 8.5,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text> (Ce formulaire est disponible en francais)</Text>
          </View>

          <View
            style={{
              flex: 1,
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

      {/* Personal Tax Credits Return  Page 2*/}
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
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Filling out Form TD1</Text>
              </Text>
              <Text>Fill out this form only if any of the following apply:</Text>
              <Text style={{ paddingLeft: 10 }}>
                • You have a new employer or payer, and you will receive salary, wages, commissions,
                pensions, employment insurance benefits, or any other remuneration
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to change the amounts you previously claimed (for example, the number of
                your eligible dependants has changed)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to claim the deduction for living in a prescribed zone
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to increase the amount of tax deducted at source
              </Text>
              <Text>Sign and date it, and give it to your employer or payer.</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
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
                  <Checkbox checked={claims.has_two_employeer} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    If you have more than one employer or payer at the same time and you have
                    already claimed personal tax credit amounts on another Form TD1 for 2026, you
                    cannot claim them again. If your total income from all sources will be more than
                    the personal tax credits you claimed on another Form TD1, check this box, enter
                    “0” on Line 13 and do not fill in Lines 2 to 12.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3x 5px',
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
                  <Checkbox checked={claims.not_eligible} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    Tick this box if your total income for the year from all employers and payers
                    will be less than your total claim amount on line 13. Your employer or payer
                    will not deduct tax from your earnings.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  For non-resident only (Tick the box that applies to you.)
                </Text>
              </Text>
              <Text>
                As a non-resident, will 90% or more of your world income be included in determining
                your taxable income earned in Canada in 2026?
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
                  <Checkbox checked={claims.is_non_resident == 'yes'} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>Yes (Fill out the previous page.)</Text>
                </View>
              </View>
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
                  <Checkbox checked={claims.is_non_resident == 'no'} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    No (Enter “0” on line 13, and do not fill in lines 2 to 12 as you are not
                    entitled to the personal tax credits.)
                  </Text>
                </View>
              </View>
              <Text>
                Call the international tax and non-resident enquiries line at **1-800-959-8281** if
                you are unsure of your residency status.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Provincial or territorial personal tax credits return
                </Text>
              </Text>
              <Text>
                You also have to fill out a provincial or territorial TD1 form if your claim amount
                on line 13 is more than <Text style={{ fontFamily: 'Roboto-Bold' }}>$16,129</Text>.
                Use the Form TD1 for your province or territory of employment if you are an
                employee. Use the Form TD1 for your province or territory of residence if you are a
                pensioner. Your employer or payer will use both this federal form and your most
                recent provincial or territorial Form TD1 to determine the amount of your tax
                deductions.
              </Text>
              <Text style={{ marginTop: 10 }}>
                Your employer or payer will deduct provincial or territorial taxes after allowing
                the provincial or territorial basic personal amount if you are claiming the basic
                personal amount only.
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Note:</Text> You may be able to claim
                the child amount on Form TD1SK, 2026 Saskatchewan Personal Tax Credits Return if you
                are a Saskatchewan resident supporting children under 18 at any time during 2026.
                Therefore, you may want to fill out Form TD1SK even if you are only claiming the
                basic personal amount on this form.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Deduction for living in a prescribed zone
                </Text>
              </Text>
              <Text>
                You may claim any of the following amounts if you live in the Northwest Territories,
                Nunavut, Yukon, or another prescribed{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>northern zone</Text> for more than six
                months in a row beginning or ending in 2026:
              </Text>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View style={{ flex: 2 }}>
                  <Text style={{ paddingLeft: 10 }}>
                    • <Text style={{ fontFamily: 'Roboto-Bold' }}>$11.00</Text> for each day that
                    you live in the prescribed northern zone
                  </Text>
                  <Text style={{ paddingLeft: 10 }}>
                    • <Text style={{ fontFamily: 'Roboto-Bold' }}>$22.00</Text> for each day that
                    you live in the prescribed northern zone if, during that time, you live in a
                    dwelling that you maintain, and you are the only person living in that dwelling
                    who is claiming this deduction
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      width: '90px',
                      border: '1px',
                      borderColor: '#000',
                      padding: '5px',
                      height: '25px',
                    }}
                  >
                    <Text>
                      ${' '}
                      {claims.deduction_living_prescribed_zone
                        ? formatNumber(claims.deduction_living_prescribed_zone)
                        : ' '}
                    </Text>
                  </View>
                </View>
              </View>
              <Text>
                Employees living in a prescribed **intermediate zone** may claim 50% of the total of
                the above amounts.
              </Text>
              <Text>
                For more information, go to{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  canada.ca/taxes-northern-residents
                </Text>
                .
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Additional tax to be deducted</Text>
              </Text>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View style={{ flex: 4 }}>
                  <Text>
                    You may want to have more tax deducted from each payment if you receive other
                    income such as non-employment income from CPP or QPP benefits, or old age
                    security pension. You may have less tax to pay when you file your income tax and
                    benefit return by doing this. Enter the additional amount you want deducted from
                    each payment to choose this option. You may fill out a new Form TD1 to change
                    this deduction later.
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      width: '90px',
                      border: '1px',
                      borderColor: '#000',
                      padding: '5px',
                      height: '25px',
                    }}
                  >
                    <Text>
                      ${' '}
                      {claims.addition_tax_deducted
                        ? formatNumber(claims.addition_tax_deducted)
                        : ' '}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
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
                forward from the previous year). To make this request, fill out Form{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>T1213</Text>, Request to Reduce Tax
                Deductions at Source, to get a letter of authority from your tax services office.
                Give the letter of authority to your employer or payer. You do not need a letter of
                authority if your employer deducts RRSP contributions from your salary.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Forms and publications</Text>
              </Text>
              <Text>
                To get our forms and publications, go to{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>canada.ca/cra-forms-publications</Text>{' '}
                or call <Text style={{ fontFamily: 'Roboto-Bold' }}>1-800-959-5525</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 8 }}>
          Personal information (including the SIN) is collected and used to administer or enforce
          the Income Tax Act and related programs and activities including administering tax,
          benefits, audit, compliance, and collection. The information collected may be disclosed to
          other federal, provincial, territorial, aboriginal or foreign government institutions to
          the extent authorized by law. Failure to provide this information may result in paying
          interest or penalties, or in other actions. Under the Privacy Act, individuals have a
          right of protection, access to and correction of their personal information, and to file a
          complaint with the Privacy Commissioner of Canada regarding the handling of their personal
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source at
          <Text style={{ fontFamily: 'Roboto-Bold' }}> canada.ca/cra-info-source</Text>.
        </Text>
        {/* <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5,
            border: '1px',
            borderColor: '#000',
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
              alignItems: 'flex-start',
              gap: 5,
              marginTop: 10,
            }}
          >
            <Text style={{ width: '50px' }}>Signature</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 2,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}>
                <Text
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: 'Roboto-Bold',
                    textTransform: 'uppercase',
                  }}
                >{`${employee.first_name} ${employee.last_name}`}</Text>
              </Text>
              <Text style={{ width: '100%', textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
                It is a serious offence to make a false return.
              </Text>
            </View>
            <Text style={{ width: '20px' }}>Date</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}>
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
              </Text>
            </View>
          </View>
        </View> */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5,
            border: '1px',
            borderColor: '#000',
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
                  borderBottom: 1,
                }}
              >
                <Image
                  src={employee.signature}
                  style={{
                    maxWidth: 70,
                    maxHeight: 70,
                    objectFit: 'contain',
                  }}
                />
              </View>
              <Text style={{ width: '100%', textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
                It is a serious offence to make a false return.
              </Text>
            </View>
            <Text style={{ width: '20px' }}>Date</Text>
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
                  borderBottom: 1,
                  paddingBottom: '8px',
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
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
            <Text>Page 2 of 2</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
