import type { IUser } from 'src/types/user';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';

import { varAlpha } from 'minimal-shared/utils';

import { useQuery } from '@tanstack/react-query';

import { Scrollbar } from 'src/components/scrollbar';

import type { AttendanceConductCategoryItem } from './attendance-conduct-score-overview';
import { AttendanceConductScoreOverview } from './attendance-conduct-score-overview';
import {
  AttendanceConductDataActivity,
  MOCK_ACTIVITY_SERIES,
} from './attendance-conduct-data-activity';

// ----------------------------------------------------------------------

const CATEGORY_ALL = 'all';

/** Min height for the score + incident activity row so both cards match (score card content height). */
const SCORE_ACTIVITY_ROW_MIN_HEIGHT = 538;

/** Categories that impact score (shown in score overview and data activity). */
const SCORE_IMPACT_CATEGORIES: { value: string; label: string; key: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show', key: 'noShowUnpaid' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'refusalOfShifts', label: 'Refusal of Shift', key: 'refusalOfShifts' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
];

/** Mock: points deducted from score per occurrence (replace with backend rule later). */
const SCORE_DEDUCT_PER_OCCURRENCE: Record<string, number> = {
  noShowUnpaid: 15,
  sentHomeNoPpe: 10,
  leftEarlyNoNotice: 5,
  refusalOfShifts: 10,
  unauthorizedDriving: 15,
  drivingInfractions: 10,
  verbalWarningsWriteUp: 5,
};

const CONDUCT_CATEGORIES: { value: string; label: string; key: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show (Unpaid)', key: 'noShowUnpaid' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (no PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)', key: 'vacationDayUnpaid' },
  { value: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)', key: 'sickLeaveUnpaid' },
  { value: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)', key: 'personalDayOffUnpaid' },
  { value: 'vacationDay10', label: 'Vacation Day (10)', key: 'vacationDay10' },
  { value: 'refusalOfShifts', label: 'Refusal of shift', key: 'refusalOfShifts' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without day Off', key: 'unapprovePayoutWithoutDayOff' },
  { value: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice', key: 'unapprovedDaysOffShortNotice' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  { value: 'sickLeave5', label: 'Sick Leave (5)', key: 'sickLeave5' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
];

type ConductData = {
  score: number;
  noShowUnpaid: number;
  sentHomeNoPpe: number;
  leftEarlyNoNotice: number;
  vacationDayUnpaid: number;
  sickLeaveUnpaid: number;
  personalDayOffUnpaid: number;
  vacationDay10: number;
  refusalOfShifts: number;
  unauthorizedDriving: number;
  unapprovePayoutWithoutDayOff: number;
  unapprovedDaysOffShortNotice: number;
  drivingInfractions: number;
  sickLeave5: number;
  verbalWarningsWriteUp: number;
};

const defaultConductData: ConductData = {
  score: 100,
  noShowUnpaid: 0,
  sentHomeNoPpe: 0,
  leftEarlyNoNotice: 0,
  vacationDayUnpaid: 0,
  sickLeaveUnpaid: 0,
  personalDayOffUnpaid: 0,
  vacationDay10: 0,
  refusalOfShifts: 0,
  unauthorizedDriving: 0,
  unapprovePayoutWithoutDayOff: 0,
  unapprovedDaysOffShortNotice: 0,
  drivingInfractions: 0,
  sickLeave5: 0,
  verbalWarningsWriteUp: 0,
};

/** Mock data with some non-zero counts for demo (replace with API data). */
const mockConductDataWithCounts: ConductData = {
  ...defaultConductData,
  score: 100,
  noShowUnpaid: 1,
  verbalWarningsWriteUp: 2,
  leftEarlyNoNotice: 1,
  sickLeaveUnpaid: 2,
  drivingInfractions: 0,
  unapprovedDaysOffShortNotice: 0,
};

type Props = {
  currentUser: IUser;
};

export function UserAttendanceConductTab({ currentUser }: Props) {
  const [categoryTab, setCategoryTab] = useState<string>(CATEGORY_ALL);

  const { data: conductData, isLoading } = useQuery({
    queryKey: ['user-attendance-conduct', currentUser.id],
    queryFn: async () => {
      // TODO: replace with dedicated endpoint when backend supports it
      // const res = await fetcher(`${endpoints.management.user}/${currentUser.id}/attendance-conduct`);
      // return res.data;
      return mockConductDataWithCounts;
    },
    enabled: !!currentUser?.id,
  });

  const data = conductData ?? mockConductDataWithCounts;

  const scoreOverviewData: AttendanceConductCategoryItem[] = useMemo(
    () =>
      SCORE_IMPACT_CATEGORIES.map((cat) => {
        const count = (data as Record<string, number>)[cat.key] ?? 0;
        const pointsPer = SCORE_DEDUCT_PER_OCCURRENCE[cat.key] ?? 0;
        const deduct = count > 0 ? count * pointsPer : 0;
        return {
          name: cat.label,
          count,
          deduct: deduct > 0 ? deduct : undefined,
        };
      }),
    [data]
  );

  const categoriesToShow = useMemo(() => {
    if (categoryTab === CATEGORY_ALL) return CONDUCT_CATEGORIES;
    return CONDUCT_CATEGORIES.filter((c) => c.value === categoryTab);
  }, [categoryTab]);

  const handleCategoryTabChange = (_: React.SyntheticEvent, value: string) => {
    setCategoryTab(value);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'stretch',
          minHeight: { xs: undefined, md: SCORE_ACTIVITY_ROW_MIN_HEIGHT },
        }}
      >
        <AttendanceConductScoreOverview
          score={data.score}
          data={scoreOverviewData}
          sx={{ flexShrink: 0, width: { xs: '100%', md: 320 } }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            minHeight: 0,
          }}
        >
          <AttendanceConductDataActivity
            title="Incident activity"
            chart={{ series: MOCK_ACTIVITY_SERIES }}
            sx={{ width: '100%', height: '100%', minHeight: SCORE_ACTIVITY_ROW_MIN_HEIGHT }}
          />
        </Box>
      </Box>

      <Card>
        <Tabs
          value={categoryTab}
          onChange={handleCategoryTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          <Tab value={CATEGORY_ALL} label="All" />
          {CONDUCT_CATEGORIES.map((cat) => (
            <Tab key={cat.value} value={cat.value} label={cat.label} />
          ))}
        </Tabs>

        <Scrollbar sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Count
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2}>Loading…</TableCell>
                </TableRow>
              ) : (
                categoriesToShow.map((cat) => {
                  const count = (data as Record<string, number>)[cat.key] ?? 0;
                  return (
                    <TableRow key={cat.value} hover>
                      <TableCell>{cat.label}</TableCell>
                      <TableCell align="right">{count > 0 ? count : ''}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </Box>
  );
}
