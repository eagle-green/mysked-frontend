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

/** Score-impacting categories only (used for activity chart). */
const SCORE_IMPACT_SERIES_NAMES = [
  'No Show',
  'Sent home from site (No PPE)',
  'Left Early No Notice',
  'Refusal of Shift',
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
function getWeeklyCategoriesWithDates(): (string | string[])[] {
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

/** Mock data for Attendance & Conduct activity over time (replace with API later). */
export const MOCK_ACTIVITY_SERIES: SeriesItem[] = [
  {
    name: 'Weekly',
    categories: getWeeklyCategoriesWithDates(),
    data: SCORE_IMPACT_SERIES_NAMES.map((name, i) => ({
      name,
      data: [0, 0, i % 2, 0, 0],
    })),
  },
  {
    name: 'Monthly',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    data: SCORE_IMPACT_SERIES_NAMES.map((name, i) => ({
      name,
      data: [0, i % 2, 0, 1, 0, 0, i % 3, 0, 0, 0, 0, 0],
    })),
  },
  {
    name: 'Yearly',
    categories: ['2024', '2025', '2026'],
    data: SCORE_IMPACT_SERIES_NAMES.map((name, i) => ({
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
