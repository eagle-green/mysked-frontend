import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type SeriesItem = {
  name: string;
  /** Category labels; each item can be a string or string[] for multi-line (e.g. ['Week 1', 'Mar 2 - Mar 8']). */
  categories?: (string | string[])[];
  data: { name: string; data: number[] }[];
};

type Props = CardProps & {
  title?: string;
  chart: {
    colors?: string[];
    series: SeriesItem[];
    options?: ChartOptions;
  };
};

/** Incident activity: "bad" categories only, in same order as conduct tabs (No Show → Verbal Warnings / Write Up). */
export const INCIDENT_ACTIVITY_LABELS: string[] = [
  'No Show (Unpaid)',
  'Refusal of shift',
  'Sent home from site (No PPE)',
  'Left Early No Notice',
  'Late on Site',
  'Unapproved Days Off / Short Notice',
  'Called in Sick',
  'Unauthorized Driving',
  'Driving Infractions',
  'Verbal Warnings / Write Up',
];

const WEEK_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Next 5 weeks: Week 1 = current week (Mon–Sun), Week 2 = next week, etc. Returns multi-line categories: [['Week 1', 'Mar 2 - Mar 8'], ...]. */
export function getWeeklyCategoriesWithDates(): (string | string[])[] {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);

  return [1, 2, 3, 4, 5].map((n) => {
    const weekStart = new Date(thisMonday.getTime() + (n - 1) * 7 * MS_PER_DAY);
    const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);
    const startStr = weekStart.toLocaleDateString('en-US', WEEK_DATE_OPTIONS);
    const endStr = weekEnd.toLocaleDateString('en-US', WEEK_DATE_OPTIONS);
    return [`Week ${n}`, `${startStr} - ${endStr}`];
  });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_OPTIONS = ['2024', '2025', '2026'];

/** Get week bucket index 0–4 for a date (Week 1 = current week). Dates before current week → 0; after week 5 → 4. */
function getWeekBucketIndex(date: Date): number {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const dateMonday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + mondayOffset);
  const now = new Date();
  const nowDay = now.getDay();
  const nowMondayOffset = nowDay === 0 ? -6 : 1 - nowDay;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + nowMondayOffset);
  const diffMs = dateMonday.getTime() - thisMonday.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * MS_PER_DAY));
  if (diffWeeks < 0) return 0;
  if (diffWeeks > 4) return 4;
  return diffWeeks;
}

/** Build incident activity series from real data: datesPerCategory[i] = dates for INCIDENT_ACTIVITY_LABELS[i]. */
export function buildIncidentActivitySeries(
  datesPerCategory: (string | Date | null | undefined)[][]
): SeriesItem[] {
  const weeklyCounts = INCIDENT_ACTIVITY_LABELS.map((_, i) => {
    const counts = [0, 0, 0, 0, 0];
    const dates = datesPerCategory[i] ?? [];
    dates.forEach((d) => {
      if (d == null) return;
      const date = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(date.getTime())) return;
      const wi = getWeekBucketIndex(date);
      counts[wi] += 1;
    });
    return counts;
  });
  const monthlyCounts = INCIDENT_ACTIVITY_LABELS.map((_, i) => {
    const counts = new Array(12).fill(0);
    const dates = datesPerCategory[i] ?? [];
    dates.forEach((d) => {
      if (d == null) return;
      const date = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(date.getTime())) return;
      counts[date.getMonth()] += 1;
    });
    return counts;
  });
  const yearlyCounts = INCIDENT_ACTIVITY_LABELS.map((_, i) => {
    const counts = [0, 0, 0];
    const dates = datesPerCategory[i] ?? [];
    dates.forEach((d) => {
      if (d == null) return;
      const date = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(date.getTime())) return;
      const y = date.getFullYear();
      const yi = y === 2024 ? 0 : y === 2025 ? 1 : y === 2026 ? 2 : -1;
      if (yi >= 0) counts[yi] += 1;
    });
    return counts;
  });

  return [
    {
      name: 'Weekly',
      categories: getWeeklyCategoriesWithDates(),
      data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({ name, data: weeklyCounts[i] })),
    },
    {
      name: 'Monthly',
      categories: MONTH_NAMES,
      data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({ name, data: monthlyCounts[i] })),
    },
    {
      name: 'Yearly',
      categories: YEAR_OPTIONS,
      data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({ name, data: yearlyCounts[i] })),
    },
  ];
}

/** Mock data for Attendance & Conduct activity over time (fallback when no real data). */
export const MOCK_ACTIVITY_SERIES: SeriesItem[] = [
  {
    name: 'Weekly',
    categories: getWeeklyCategoriesWithDates(),
    data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
      name,
      data: [0, 0, i % 2, 0, 0],
    })),
  },
  {
    name: 'Monthly',
    categories: MONTH_NAMES,
    data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
      name,
      data: [0, i % 2, 0, 1, 0, 0, i % 3, 0, 0, 0, 0, 0],
    })),
  },
  {
    name: 'Yearly',
    categories: YEAR_OPTIONS,
    data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
      name,
      data: [i, i + 1, i % 2],
    })),
  },
];

export function AttendanceConductDataActivity({
  title = 'Incident activity',
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();
  const [selectedSeries, setSelectedSeries] = useState(chart.series[0]?.name ?? 'Weekly');
  const currentSeries = chart.series.find((i) => i.name === selectedSeries);

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.secondary.main,
    theme.palette.grey[600],
  ];

  const chartOptions = useChart({
    chart: { stacked: true },
    colors: chartColors,
    stroke: { width: 0 },
    legend: { show: true },
    xaxis: {
      categories: currentSeries?.categories,
      labels: { rotate: 0 },
    },
    yaxis: { min: 0, max: 10 },
    plotOptions: { bar: { borderRadius: 2, columnWidth: '64%' } },
    ...chart.options,
  });

  const handleChangeSeries = useCallback((event: { target: { value: string } }) => {
    setSelectedSeries(event.target.value);
  }, []);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
      {...other}
    >
      <CardHeader
        title={title}
        sx={{ flexShrink: 0 }}
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="activity-period-label">Period</InputLabel>
            <Select
              labelId="activity-period-label"
              value={selectedSeries}
              label="Period"
              onChange={handleChangeSeries}
            >
              {chart.series.map((s) => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          pl: 1,
          pr: 2.5,
          pb: 2.5,
        }}
      >
        <Chart
          type="bar"
          series={currentSeries?.data ?? []}
          options={chartOptions}
          slotProps={{ loading: { p: 2.5 } }}
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
          }}
        />
      </Box>
    </Card>
  );
}
