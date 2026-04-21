import type { NewHire} from 'src/types/new-hire';

import dayjs from 'dayjs';
import { TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { hasPdfImageSrc } from 'src/utils/safe-pdf-image-src';
import { formatSinForDisplay } from 'src/utils/format-canadian-sin';
import { formatNanpPhoneDisplay } from 'src/utils/format-phone-nanp';
import {
  formatGenderDisplay,
  formatSingleNameField,
} from 'src/utils/format-pdf-display';

import { HrspP, EmployeeType, WorkSchedule, RadioButtonValues } from 'src/types/new-hire';

Font.register({
  family: 'Roboto-Bold',
  src: '/fonts/Roboto-Bold.ttf',
});

Font.register({
  family: 'Roboto-Regular',
  src: '/fonts/Roboto-Regular.ttf',
});

const styles = StyleSheet.create({
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
    fontSize: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: '30px',
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 14,
    paddingRight: 8,
    // border: '1px solid #000',
  },
  th: {
    height: 25,
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: 0,
    paddingRight: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tdColumn: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    width: '100%',
  },
  /** Extra inset so react-pdf does not clip the first glyph at cell edges (same issue as policy headers). */
  tdCellInner: {
    width: '100%',
    paddingLeft: 3,
  },
});

type Props = {
  data: NewHire;
};

export function EmployeeHireForm({ data }: Props) {
  const isCheck = true;
  const { employee, contract_detail } = data;
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
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontFamily: 'Roboto-Bold' }}>EMPLOYEE HIRE FORM</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                marginTop: 10,
              }}
            >
              <View
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Checkbox checked={isCheck} />
                <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold' }}>NEW HIRE</Text>
              </View>
              <View
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Checkbox />
                <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold' }}>RE-HIRE</Text>
              </View>
            </View>
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
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE PERSONAL INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>FIRST NAME: </Text>
                  <Text style={{ fontSize: 9 }}>{formatSingleNameField(employee.first_name)}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>LAST NAME: </Text>
                  <Text style={{ fontSize: 9 }}>{formatSingleNameField(employee.last_name)}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>MIDDLE INITIAL: </Text>
                  <Text style={{ fontSize: 9 }}>{formatSingleNameField(employee.middle_initial)}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>SIN:</Text>
                  <Text>{formatSinForDisplay(employee.sin)}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>BIRTHDATE (MM/DD/YYYY)</Text>
                  <Text>{dayjs(employee.date_of_birth as string).format('MM/DD/YYYY')}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>GENDER:</Text>
                  <Text>{formatGenderDisplay(employee.gender)}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>ADDRESS:</Text>
                  <Text>{employee.address}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>TOWN/CITY:</Text>
                  <Text>{employee.city}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>PROVINCE:</Text>
                  <Text>{employee.province}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>POSTAL CODE:</Text>
                  <Text>{employee.postal_code}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>HOME PHONE #:</Text>
                  <Text>{formatNanpPhoneDisplay(employee.home_phone_no)}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>CELLPHONE #:</Text>
                  <Text>{formatNanpPhoneDisplay(employee.cell_no)}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>PERSONAL EMAIL ADDRESS:</Text>
                  <Text>{employee.email_address}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 2 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>EMPLOYEE SIGNATURE:</Text>
                  <View style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {hasPdfImageSrc(employee.signature) ? (
                      <Image src={employee.signature as string} style={{ width: 120, height: 110 }} />
                    ) : (
                      <View style={{ minHeight: 40, width: '100%' }} />
                    )}
                  </View>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, { alignItems: 'center' }]}>
                <View style={[styles.tdCellInner, { alignItems: 'center' }]}>
                  <Text>DATE: </Text>
                  <Text>{dayjs().format('MM/DD/YYYY')}</Text>
                </View>
              </TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE PERSONAL INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>DEPARTMENT: </Text>
                  <Text style={{ fontSize: 9 }}>{contract_detail.department}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>HOME COST CENTRE: </Text>
                  <Text style={{ fontSize: 9 }}>{contract_detail.home_cost_centre}</Text>
                </View>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <View style={styles.tdCellInner}>
                  <Text>JOB NUMBER: </Text>
                  <Text style={{ fontSize: 9 }}>{contract_detail.job_number}</Text>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '30px', paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 8 }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.is_union == EmployeeType.UNION} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>UNION</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.is_union == EmployeeType.NON_UNION} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>NON-UNION</Text>
                  </View>
                </View>
              </TD>
              <TD style={[{ flex: 2, height: '30px', paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 8 }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.work_schedule == WorkSchedule.WK} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>ER WK</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.work_schedule == WorkSchedule.FULL_TIME} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Full Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.work_schedule == WorkSchedule.PART_TIME} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Part Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.work_schedule == WorkSchedule.CASUAL} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Casual</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={contract_detail.work_schedule == WorkSchedule.SEASONAL} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Seasonal</Text>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
                <View style={styles.tdCellInner}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <Text>$ SALARY/WAGE: {contract_detail.salary_wage}</Text>
                    <Text>DIRECT LABOR: ({contract_detail.is_union})</Text>
                  </View>
                </View>
              </TD>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
                <View style={styles.tdCellInner}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                  <View>
                    <Text>HRS P</Text>
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Checkbox checked={contract_detail.hrsp === HrspP.AREA_OVERHEAD_NON_UNION} />
                      <Text style={[styles.bold, { fontSize: 10 }]}>AREA OVERHEAD (NON-UNION)</Text>
                    </View>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Checkbox checked={contract_detail.hrsp === HrspP.OPS_SUPPORT_HOME_OFFICE} />
                      <Text style={[styles.bold, { fontSize: 10 }]}>OPS SUPPORT (HOME OFFICE)</Text>
                    </View>
                  </View>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 8, height: '30px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Text>WAS THE NEW HIRED REFERRED?</Text>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Checkbox checked={contract_detail.is_refered == RadioButtonValues.YES} />
                    <Text>YES</Text>
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Checkbox checked={contract_detail.is_refered == RadioButtonValues.NO} />
                    <Text>NO</Text>
                  </View>
                  <Text>
                    REFERRED BY:{' '}
                    {contract_detail.is_refered == RadioButtonValues.YES
                      ? contract_detail.refered_by
                      : ''}
                  </Text>
                </View>
              </TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>
            COMPLETE THIS SECTION FOR ADDITIONAL INFORMATION
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Text style={{ fontSize: 10 }}>HIRING MGR/HR COMMENTS:</Text>
          <View
            style={{
              borderBottom: '1px',
              padding: '15px 5px',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 10 }}>{contract_detail.comments}</Text>
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
          <Text style={[styles.bold, { fontSize: 16 }]}>APPROVALS</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 15,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SUPERINTENDENT </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>AREA MANAGER </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 15,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
              VP OPERATIONS/PRESIDENT{' '}
            </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
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
          <Text style={[styles.bold, { fontSize: 16 }]}>PAYROLL USE ONLY</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: 10,
            width: '100%',
          }}
        >
          <Text>EMPLOYEE NUMBER:</Text>

          <Text>TAX SLIPS ON</Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Text>SOCIAL:</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Checkbox />
              <Text>YES</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Checkbox checked={isCheck} />
              <Text>NO</Text>
            </View>
          </View>
        </View>
      </Page>
  );
}
