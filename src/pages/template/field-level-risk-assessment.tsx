import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import {
  Svg,
  Page,
  Text,
  View,
  Font,
  Path,
  Image,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';

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
    padding: '0 30px',
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  textBold: {
    fontFamily: 'Roboto-Bold',
  },
  textUpperCase: {
    textTransform: 'uppercase',
  },
  container: {
    width: 480,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    logo: {
      width: 95,
      hieght: 95,
    },
    title: {
      fontSize: '26px',
      letterSpacing: 2,
    },
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
    fontFamily: 'Roboto-Regular',
    fontSize: 9,
    padding: '0 2px',
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
  noBorderTableHead: {
    border: '0 solid #fff',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    fontSize: 10,
    paddingLeft: 5,
    paddingBottom: 2,
  },
  contentCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    border: '1px solid #000',
    padding: 5,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
  },
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: 380,
  },
});

function Banner() {
  return (
    <View style={{ position: 'relative', top: 0 }}>
      <Image src="/pdf/banner.png" style={[styles.container]} />
    </View>
  );
}

function FooterBanner({ pageNumber = '' }) {
  return (
    <View style={{ position: 'relative', bottom: 0, width: '100%' }}>
      <Text style={{ width: '480px', fontSize: '8px', textAlign: 'right', marginBottom: 2 }}>
        Page {pageNumber} of 2
      </Text>
      <Image src="/pdf/banner-footer.png" style={[styles.container]} />
    </View>
  );
}

function Check() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12">
      <Path d="M3,6 L5,8 L9,4" fill="none" stroke="black" strokeWidth="1" />
    </Svg>
  );
}

function CheckedBox() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12">
      <Path d="M1,1 L1,11 L11,11 L11,1 L1,1" fill="none" stroke="black" strokeWidth="1" />
      <Path d="M3,6 L5,8 L9,4" fill="none" stroke="black" strokeWidth="1" />
    </Svg>
  );
}

function EmptyCheckBox() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12">
      <Path d="M1,1 L1,11 L11,11 L11,1 L1,1" fill="none" stroke="black" strokeWidth="1" />
    </Svg>
  );
}

function Header() {
  return (
    <View style={[styles.header, styles.container]}>
      <View>
        {' '}
        <Image style={styles.header.logo} src="/logo/eaglegreen-single.png" />{' '}
      </View>
      <View>
        <Text style={[styles.header.title, styles.textUpperCase, styles.textBold]}>
          Field level risk
        </Text>
        <Text style={[styles.header.title, styles.textUpperCase, styles.textBold]}>
          assessment (FLRA)
        </Text>
      </View>
    </View>
  );
}
export type FieldLevelRiskAssessmentType = {
  full_name: string;
  date: string;
  site_foreman_name: string;
  contact_number: string;
  site_location: string;
  start_time: string;
  end_time: string;
  first_aid_on_site: string;
  first_aid_kit: string;
  descriptionOfWork: {
    road: string;
    distance: string;
    weather: string;
  };
  scopeOfWork: {
    roadType: string[];
    contractToolBox: string;
  };
  present: {
    identified: string;
    reduce: string;
    new: string;
    complete: string;
  };
  riskAssessment: {
    visibility: string;
    lineOfSight: string;
    slipAndStrip: string;
    holes: string;
    weather: string;
    dust: string;
    fumes: string;
    noise: string;
    blindSpot: string;
    overHeadLines: string;
    workingAlone: string;
    mobileEquipment: string;
    trafficVolume: string;
    conditions: string;
    utilities: string;
    fatigue: string;
    controlMeasure: string;
    other: string;
  };
  trafficControlPlans: [
    {
      hazard_risk_assessment: string;
      control_measure: string;
    },
  ];
  updates: [
    {
      date_time_updates: string;
      changes: string;
      additional_control: string;
      initial: string;
    },
  ];
  responsibilities: [
    {
      role: string;
      serialNumber: string;
      responsibility: string;
      initial: string;
    },
  ];
  authorizations: [
    {
      fullName: string;
      company: string;
      date_time: string;
    },
  ];
  supervisionLevels: {
    communicationMode: boolean;
    pictureSubmission: boolean;
    supervisorPresence: boolean;
  };
  signature: string | null;
};
type AssessmentJobDetails = {
  full_name: string;
  date: string;
  site_foreman_name: string;
  contact_number: string;
  site_location: string;
  start_time: string;
  end_time: string;
  first_aid_on_site: string;
  first_aid_kit: string;
};
type FlraContentProps = {
  data: AssessmentJobDetails;
};
function FlraContent({ data }: FlraContentProps) {
  return (
    <Table style={[styles.table, styles.container]}>
      <TH style={[styles.tableHeader, styles.textBold]}>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>NAME : {data.full_name}</Text>
        </TD>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>DATE : {data.date}</Text>
        </TD>
      </TH>
      <TH style={[styles.tableHeader, styles.textBold]}>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>SITE FOREMAN NAME : {data.site_foreman_name}</Text>
        </TD>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>CONTACT NUMBER : {data.contact_number}</Text>
        </TD>
      </TH>
      <TH style={[styles.tableHeader, styles.textBold]}>
        <TD style={styles.th}>COMPANY CONTRACTED TO</TD>
        <TD style={styles.th}>CLOSEST HOSPITAL</TD>
      </TH>
      <TH style={[styles.tableHeader, styles.textBold]}>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>SITE LOCATION : {data.site_location}</Text>
        </TD>
        <TD
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '1px 2px',
          }}
        >
          <Text style={[{ flex: 1 }, styles.textUpperCase]}>START TIME: {data.start_time}</Text>
          <Text style={[{ flex: 1 }, styles.textUpperCase]}>END TIME: {data.end_time}</Text>
        </TD>
      </TH>
      <TH style={[styles.tableHeader, styles.textBold]}>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>FIRST AID ON SITE : {data.first_aid_on_site}</Text>
        </TD>
        <TD style={styles.th}>
          <Text style={styles.textUpperCase}>FIRST AID KIT : {data.first_aid_kit}</Text>
        </TD>
      </TH>
    </Table>
  );
}

type BoxProps = {
  label: string;
  underline?: boolean;
  isChecked?: boolean;
};

function CheckBox({ label, underline = false, isChecked = false }: BoxProps) {
  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 2,
        fontSize: 9,
      }}
    >
      {isChecked ? <CheckedBox /> : <EmptyCheckBox />}
      <Text>
        {label} {underline && <>__________________________</>}{' '}
      </Text>
    </View>
  );
}

type CheckBoxContentProps = {
  label: string;
  items: Array<{
    label: string;
    size: number;
    underlined?: boolean;
    isChecked?: boolean;
  }>;
  labelContainerWidth?: number;
  labelFontSize?: number;
};

function CheckBoxContent({
  items,
  label,
  labelContainerWidth = 0,
  labelFontSize,
}: CheckBoxContentProps) {
  return (
    <View style={[styles.row, { gap: 10, marginHorizontal: 5 }]}>
      {label && (
        <View style={{ width: labelContainerWidth ? labelContainerWidth : 70 }}>
          <Text style={[{ fontSize: labelFontSize ? labelFontSize : 10 }, styles.textBold]}>
            {label}
          </Text>
        </View>
      )}
      <View style={styles.checkboxContainer}>
        {items.map((item, index) => (
          <View key={index} style={{ width: item.size }}>
            <CheckBox label={item.label} underline={item.underlined} isChecked={item.isChecked} />
          </View>
        ))}
      </View>
    </View>
  );
}

type DescriptionOfWorkProps = {
  data: {
    road: string;
    distance: string;
    weather: string;
  };
};

function DescriptionOfWork({ data }: DescriptionOfWorkProps) {
  const { road, distance, weather } = data;
  const check = (value: string, pair: string) => value.toLowerCase() === pair.toLowerCase();
  const checkboxItems = [
    {
      label: 'Road',
      items: [
        { label: 'City', size: 50, underlined: false, isChecked: check(road, 'city') },
        { label: 'Rural', size: 50, underlined: false, isChecked: check(road, 'rural') },
        { label: 'HWY', size: 60, underlined: false, isChecked: check(road, 'hwy') },
        { label: 'Other', size: 150, underlined: true, isChecked: check(road, 'other') },
      ],
    },
    {
      label: 'Sight Distance',
      items: [
        {
          label: 'Hill',
          size: 50,
          underlined: false,
          isChecked: check(distance, 'hill'),
        },
        {
          label: 'Curve',
          size: 50,
          underlined: false,
          isChecked: check(distance, 'curve'),
        },
        {
          label: 'Obstacle',
          size: 60,
          underlined: false,
          isChecked: check(distance, 'obstacle'),
        },
        {
          label: 'Other',
          size: 150,
          underlined: true,
          isChecked: check(distance, 'other'),
        },
      ],
    },
    {
      label: 'Weather',
      items: [
        {
          label: 'Sunny',
          size: 50,
          underlined: false,
          isChecked: check(weather, 'sunny'),
        },
        {
          label: 'Cloudy/Rain',
          size: 70,
          underlined: false,
          isChecked: check(weather, 'cloudy'),
        },
        {
          label: 'Snow',
          size: 50,
          underlined: false,
          isChecked: check(weather, 'snow'),
        },
        { label: 'Fog', size: 50, underlined: false, isChecked: check(weather, 'fog') },
        {
          label: 'Windy',
          size: 50,
          underlined: false,
          isChecked: weather?.toLowerCase() === 'windy',
        },
        { label: 'Hot', size: 50, underlined: false, isChecked: check(weather, 'hot') },
        {
          label: 'Cold',
          size: 50,
          underlined: false,
          isChecked: check(weather, 'cold'),
        },
      ],
    },
  ];
  return (
    <View style={[styles.container]}>
      <Text
        style={[
          {
            margin: '5px 0',
            fontSize: 10,
          },
          styles.textBold,
        ]}
      >
        DESCRIPTION OF WORK
      </Text>
      <View style={styles.box}>
        <Text
          style={[
            {
              fontSize: 9,
              textDecoration: 'underline',
              backgroundColor: '#edede3',
              width: '90px',
            },
            styles.textBold,
          ]}
        >
          ROAD CONDITIONS:
        </Text>
        <View
          style={[
            {
              padding: 5,
              gap: 5,
            },
            styles.column,
          ]}
        >
          {checkboxItems.map((cb, index) => (
            <CheckBoxContent key={index} items={cb.items} label={cb.label} />
          ))}
        </View>
      </View>
    </View>
  );
}

//------------------------------------------------------------------------------------------------
type ScopeOfWorkProps = {
  data: string[];
};

function ScopeOfWork({ data }: ScopeOfWorkProps) {
  const checked = (value: string) => data.includes(value);
  const checkboxItems = [
    {
      label: '',
      items: [
        {
          label: 'Single Lane Alternating',
          size: 120,
          underlined: false,
          isChecked: checked('alternating'),
        },
        { label: 'Lane Closure', size: 100, underlined: false, isChecked: checked('closure') },
        { label: 'Road Closed', size: 80, underlined: false, isChecked: checked('close') },
        { label: 'Other', size: 80, underlined: false, isChecked: checked('other') },
      ],
    },
    {
      label: '',
      items: [
        { label: 'Shoulder Work', size: 120, underlined: false, isChecked: checked('work') },
        { label: 'Turn Lane Closure', size: 100, underlined: false, isChecked: checked('turn') },
        { label: 'Showing Traffic', size: 85, underlined: false, isChecked: checked('traffic') },
      ],
    },
  ];

  return (
    <View style={[styles.container]}>
      <Text
        style={[
          {
            margin: '5px 0',
            fontSize: 10,
          },
          styles.textBold,
        ]}
      >
        TCP/LCP SCOPE OF WORK
      </Text>
      <View style={styles.box}>
        <View
          style={[
            {
              padding: 5,
              gap: 5,
            },
            styles.column,
          ]}
        >
          {checkboxItems.map((cb, index) => (
            <CheckBoxContent key={index} items={cb.items} label={cb.label} />
          ))}
        </View>
        <View>
          <Text
            style={[
              {
                fontSize: 9,
                textDecoration: 'underline',
                backgroundColor: '#edede3',
                marginBottom: 10,
                width: '180px',
              },
              styles.textBold,
            ]}
          >
            SCOPE OF WORK/CONTRACTOR TOOLBOX:
          </Text>
        </View>
        <View
          style={{
            borderBottom: 1,
            borderColor: '#000',
            borderStyle: 'solid',
            width: 450,
            marginBottom: 10,
          }}
        />
        <View
          style={{
            borderBottom: 1,
            borderColor: '#000',
            borderStyle: 'solid',
            width: 450,
            marginBottom: 10,
          }}
        />
      </View>
    </View>
  );
}

function RiskAssessment() {
  const rows = [
    { desc: 'VISIBILITY', low: '', med: <Check />, high: '' },
    { desc: 'LINE OF SIGHT', low: '', med: <Check />, high: '' },
    { desc: 'SLIPS AND TRIPS', low: <Check />, med: '', high: '' },
    { desc: 'FALL/OPEN HOLES', low: '', med: '', high: <Check /> },
    { desc: 'WEATHER', low: '', med: '', high: <Check /> },
    { desc: 'DUST', low: '', med: <Check />, high: '' },
    { desc: 'FUMES', low: '', med: <Check />, high: '' },
    { desc: 'EXCESSIVE NOISE', low: <Check />, med: '', high: '' },
    { desc: 'BLIND SPOTS', low: '', med: '', high: <Check /> },
    { desc: 'OVERHEAD LINES', low: <Check />, med: '', high: '' },
    { desc: 'WORKING ALONE', low: '', med: '', high: <Check /> },
    { desc: 'MOBILE EQUIPEMENT', low: '', med: '', high: <Check /> },
    { desc: 'TRAFFIC VOLUMES', low: '', med: <Check />, high: '' },
    { desc: 'LIGHTING CONDITIONS', low: '', med: <Check />, high: '' },
    { desc: 'UNDERGROUND UTILITIES', low: '', med: <Check />, high: '' },
    { desc: 'FATIGUE', low: <Check />, med: '', high: '' },
    { desc: 'CONTROL MEASURE', low: <Check />, med: '', high: '' },
    { desc: 'OTHER', low: '', med: <Check />, high: '' },
  ];
  return (
    <View style={{ width: 250 }}>
      <Table style={[styles.table, styles.container, { width: '100%' }]}>
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD style={[{ flex: 4 }, styles.noBorderTableHead]}>RISK ASSESSMENT</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>LOW</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>MED</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>HIGH</TD>
        </TH>
        {rows.map((row) => (
          <TR>
            <TD style={[styles.td, { flex: 4 }]}> {row.desc}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.low}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.med}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.high}</TD>
          </TR>
        ))}
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD style={[{ textDecoration: 'underline', flex: 4, padding: '0 2px' }, styles.textBold]}>
            <Text style={{ fontSize: 12 }}>OVERALL RISK</Text>
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            LOW
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            MED
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            HIGH
          </TD>
        </TH>
      </Table>
    </View>
  );
}

function QuickCheck() {
  const content = [
    {
      label: 'Is the escape route identified ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: [
        { label: 'Yes', size: 40, underlined: false, isChecked: true },
        { label: 'No', size: 40, underlined: false },
      ],
    },
    {
      label: 'Does the speed need to be reduce ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: [
        { label: 'Yes', size: 40, underlined: false },
        { label: 'No', size: 40, underlined: false, isChecked: true },
      ],
    },
    {
      label: 'New LCT/TCP (Less than 2 years of exp) ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: [
        { label: 'Yes', size: 40, underlined: false, isChecked: true },
        { label: 'No', size: 40, underlined: false },
      ],
    },
    {
      label: 'Do you need to complete a Young/New Worker Form ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: [
        { label: 'Yes', size: 40, underlined: false },
        { label: 'No', size: 40, underlined: false, isChecked: true },
      ],
    },
  ];
  return (
    <View style={{ width: 220 }}>
      <Text style={[{ fontSize: 10 }, styles.textBold]}>TCPs/LCTs PRESENT</Text>
      <View
        style={{
          border: '1px solid #000',
          width: '100%',
        }}
      >
        <View
          style={[
            {
              padding: 5,
              gap: 10,
              alignItems: 'center',
            },
            styles.column,
          ]}
        >
          {content.map((c, index) => (
            <CheckBoxContent
              key={index}
              label={c.label}
              items={c.items}
              labelContainerWidth={c.labelContainerWidth}
              labelFontSize={c.labelFontSize}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SignatureArea() {
  return (
    <View
      style={{
        border: '1px solid #000',
        width: 220,
      }}
    >
      <View
        style={[
          {
            padding: '15px 20px',
            justifyContent: 'space-between',
            height: 130,
            display: 'flex',
            flexDirection: 'column',
          },
        ]}
      >
        <Text style={[{ fontSize: 10 }, styles.textBold]}>
          I hereby this hazard assessment is mandatory as per company policy and worksafe BC and all
          information on this form is accurate to the best of my knowledge.
        </Text>
        <Text style={[{ fontSize: 12 }, styles.textBold]}>Signature: </Text>
      </View>
    </View>
  );
}

function TrafficControlPlan() {
  const items = Array(3).fill({});
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        TRAFFIC CONTROL PLAN
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px' }}>
            HAZARD IDENTIFIED IN RISK ASSESSMENT
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px' }}>CONTROL MEASURES</TD>
        </TH>
        {items.map((item, index) => (
          <TR key={index}>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
          </TR>
        ))}
      </Table>
    </View>
  );
}

function Updates() {
  const changes = Array(2).fill({});
  const responsibilities = Array(4).fill({});
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>UPDATES</Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>DATE AND TIME</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>CHANGES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>
            ADDITIONAL CONTROL
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {changes.map((change, index) => (
          <TR key={index}>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
          </TR>
        ))}
      </Table>
      <Table style={{ width: '100%', marginTop: 20 }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>ROLES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>SN #</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 3 }}>
            RESPONSIBILITIES
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {responsibilities.map((res, index) => (
          <TR key={index}>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 3, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
          </TR>
        ))}
      </Table>
    </View>
  );
}

function LevelOfSupervision() {
  const levels = [
    { label: 'LOW RISK', checkbox: <EmptyCheckBox />, content: 'Text or phone call to supervisor' },
    {
      label: 'MODERATE RISK',
      checkbox: <CheckedBox />,
      content: 'Send pictures of set up to supervisor',
    },
    {
      label: 'HIGH RISK',
      checkbox: <CheckedBox />,
      content: 'Supervisor must be present when setting up',
    },
  ];
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        LEVEL OF SUPERVISION
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>RISK LEVEL</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>
            SUPERVISION REQUIRED
          </TD>
        </TH>
        {levels.map((level, index) => (
          <TR key={index}>
            <TD
              style={[styles.td, { flex: 1, justifyContent: 'space-around', padding: '4px 2px' }]}
            >
              <Text style={{ textAlign: 'left', width: 90 }}>{level.label}</Text>
              {level.checkbox}
            </TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{level.content}</TD>
          </TR>
        ))}
      </Table>
    </View>
  );
}

function SignOfBy() {
  const items = Array(3).fill({});
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        SING OFF BY (included project supervisor, TC supervisor)
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>NAME</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>COMPANY</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>DATE AND TIME</TD>
        </TH>
        {items.map((item, index) => (
          <TR key={index}>
            <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
          </TR>
        ))}
      </Table>
    </View>
  );
}
type FirstPageProps = {
  frla: AssessmentJobDetails;
  descriptionOfWork: {
    road: string;
    distance: string;
    weather: string;
  };
  scopeOfWorks: string[];
};
function FirstPage({ frla, descriptionOfWork, scopeOfWorks }: FirstPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={{ position: 'relative', top: 0 }}>
        <Banner />
      </View>
      <View>
        <Header />
      </View>
      <View>
        <FlraContent data={frla} />
      </View>
      <View>
        <DescriptionOfWork data={descriptionOfWork} />
      </View>
      <View>
        <ScopeOfWork data={scopeOfWorks} />
      </View>
      <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
        <RiskAssessment />
        <View style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuickCheck />
          <SignatureArea />
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: 0 }}>
        <FooterBanner pageNumber="1" />
      </View>
    </Page>
  );
}

function SecondPage() {
  return (
    <Page size="A4" style={[styles.page]}>
      <View style={{ position: 'relative', top: 0 }}>
        <Banner />
      </View>
      <View>
        {' '}
        <Header />{' '}
      </View>
      <View>
        {' '}
        <TrafficControlPlan />{' '}
      </View>
      <View>
        {' '}
        <Updates />{' '}
      </View>
      <View>
        {' '}
        <LevelOfSupervision />{' '}
      </View>
      <View>
        {' '}
        <SignOfBy />{' '}
      </View>
      <View style={[{ justifyContent: 'flex-end' }, styles.container]}>
        <Text style={[{ fontSize: 8 }, styles.textBold]}>
          {' '}
          Please note that you all have the right to refuse unsafe work!
        </Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0 }}>
        <FooterBanner pageNumber="2" />
      </View>
    </Page>
  );
}

//-----------------------------------------------------------------------------
type Props = {
  data: FieldLevelRiskAssessmentType;
};

export default function FieldLevelRiskAssessmentPdf({ data }: Props) {
  const toDayjs = (value?: string | Date | null) => dayjs(value);
  const flraDetails = {
    full_name: data.full_name,
    date: toDayjs(data.date).format('DD/MM/YYYY'),
    site_foreman_name: data.site_foreman_name,
    contact_number: data.contact_number,
    site_location: data.site_location,
    start_time: toDayjs(data.start_time).format('hh:mm A'),
    end_time: toDayjs(data.end_time).format('hh:mm A'),
    first_aid_on_site: data.first_aid_on_site,
    first_aid_kit: data.first_aid_kit,
  };

  const descriptionOfWork = {
    road: data.descriptionOfWork.road,
    distance: data.descriptionOfWork.distance,
    weather: data.descriptionOfWork.weather,
  };

  return (
    <Document>
      <FirstPage
        frla={flraDetails}
        descriptionOfWork={descriptionOfWork}
        scopeOfWorks={data.scopeOfWork.roadType}
      />
      <SecondPage />
    </Document>
    // <PDFViewer height={800}>
    //   <Document>
    //     <FirstPage />
    //     <SecondPage />
    //   </Document>
    // </PDFViewer>
  );
}
