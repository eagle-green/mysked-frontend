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

export function EmployeeHireForm() {
  const isCheck = true;

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
                <Checkbox />
                <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold' }}>NEW HIRE</Text>
              </View>
              <View
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Checkbox checked={isCheck} />
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
              <TD style={[{ flex: 1 }, styles.td]}>LAST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>FIRST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>MIDDLE INITIAL:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>SIN:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>BIRTHDATE (MM/DD/YY) </TD>
              <TD style={[{ flex: 1 }, styles.td]}>GENDER:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>ADDRESS:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>TOWN/CITY:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>PROVINCE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>POSTAL CODE:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>HOME PHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>CELLPHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>PERSONAL EMAIL ADDRESS:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 2 }, styles.td]}>EMPLOYEE SIGNATURE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>DATE:</TD>
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
              <TD style={[{ flex: 1 }, styles.td]}>DEPARTMENT:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>HOME COST CENTRE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>JOB NUMBER:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '30px', padding: '5px' }]}>
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
                    <Checkbox />
                    <Text style={[styles.bold, { fontSize: 10 }]}>UNION</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={isCheck} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>NON-UNION</Text>
                  </View>
                </View>
              </TD>
              <TD style={[{ flex: 2, height: '30px', padding: '5px' }]}>
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
                    <Checkbox />
                    <Text style={[styles.bold, { fontSize: 10 }]}>ER WK</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={isCheck} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Full Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={isCheck} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Part Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={isCheck} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Casual</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={isCheck} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Seasonal</Text>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Text>$ SALARY/WAGE: HR/WK</Text>
                  <Text>DIRECT LABOR: (UNION)</Text>
                </View>
              </TD>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
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
                      <Checkbox />
                      <Text style={[styles.bold, { fontSize: 10 }]}>UNION</Text>
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
                      <Text style={[styles.bold, { fontSize: 10 }]}>NON-UNION</Text>
                    </View>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, padding: '5px', height: '30px' }]}>
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
                  <Text>REFERRED BY:</Text>
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <View
            style={{
              borderBottom: '1px',
              padding: '15px 5px',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 10 }}>HIRING MGR/HR COMMENTS:</Text>
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
    </>
  );
}
