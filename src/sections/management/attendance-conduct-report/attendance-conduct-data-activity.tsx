import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type SeriesItem = {
  name: string;
  /** X-axis labels; string or multi-line per category. */
  categories?: (string | string[])[];
  data: { name: string; data: number[] }[];
};

type Props = CardProps & {
  title?: string;
  /** Shown under title. */
  subheader?: string;
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

/**
 * 10 distinct colors (different hues) for the 10 Incident activity categories (same order as INCIDENT_ACTIVITY_LABELS).
 * Each category gets a unique color so No Show, Unauthorized Driving, Refusal, Driving Infractions, etc. are all distinguishable.
 * Use for both Incident activity chart and Report distribution pie.
 */
/** Strong hue separation (avoid blue-on-blue for No Show / Left Early / Unauthorized). */
const INCIDENT_ACTIVITY_COLORS_10 = [
  '#6A1B9A', // 0 No Show – purple
  '#D84315', // 1 Refusal – deep orange-red
  '#F9A825', // 2 Sent home – amber
  '#2E7D32', // 3 Left Early – green
  '#0277BD', // 4 Late on Site – blue
  '#AD1457', // 5 Unapproved Days Off – pink/magenta
  '#5D4037', // 6 Called in Sick – brown
  '#00897B', // 7 Unauthorized Driving – teal
  '#E65100', // 8 Driving Infractions – orange
  '#37474F', // 9 Verbal Warnings – blue-grey
];

export function getIncidentActivityColors(_theme: unknown): string[] {
  return [...INCIDENT_ACTIVITY_COLORS_10];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEK_RANGE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_OPTIONS = ['2024', '2025', '2026'];

/** Four completed weeks ending this week (Mon–Sun), oldest → newest (left → right). */
export function getLastFourWeeksCategoryLabels(): (string | string[])[] {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);

  return [3, 2, 1, 0].map((weeksBack) => {
    const mon = new Date(thisMonday.getTime() - weeksBack * 7 * MS_PER_DAY);
    const sun = new Date(mon.getTime() + 6 * MS_PER_DAY);
    const a = mon.toLocaleDateString('en-US', WEEK_RANGE_OPTS);
    const b = sun.toLocaleDateString('en-US', WEEK_RANGE_OPTS);
    const n = 4 - weeksBack;
    return [`Week ${n}`, `${a} - ${b}`];
  });
}

/** Bucket 0 = 3 weeks ago, 3 = current week. -1 if outside last 4 weeks or future. */
function getLastFourWeeksBucketIndex(date: Date): number {
  const d = date.getDay();
  const monOff = d === 0 ? -6 : 1 - d;
  const dateMonday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + monOff);
  const now = new Date();
  const nd = now.getDay();
  const nOff = nd === 0 ? -6 : 1 - nd;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + nOff);
  const weeksAgo = Math.floor((thisMonday.getTime() - dateMonday.getTime()) / (7 * MS_PER_DAY));
  if (weeksAgo < 0 || weeksAgo > 3) return -1;
  return 3 - weeksAgo;
}

/** Rolling window: 3 months ago → current month (e.g. December, January, February, March). */
export function getLastFourMonthsCategoryLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 3; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'long' }));
  }
  return labels;
}

/**
 * Bucket 0 = oldest of the 4 months, 3 = current month. -1 if outside window or future month.
 */
function getLastFourMonthsBucketIndex(date: Date): number {
  const dy = date.getFullYear();
  const dm = date.getMonth();
  const now = new Date();
  for (let i = 3; i >= 0; i -= 1) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (ref.getFullYear() === dy && ref.getMonth() === dm) {
      return 3 - i;
    }
  }
  return -1;
}

/** Build incident activity series from real data: datesPerCategory[i] = dates for INCIDENT_ACTIVITY_LABELS[i]. */
export function buildIncidentActivitySeries(
  datesPerCategory: (string | Date | null | undefined)[][]
): SeriesItem[] {
  const lastFourWeeksCounts = INCIDENT_ACTIVITY_LABELS.map((_, i) => {
    const counts = [0, 0, 0, 0];
    const dates = datesPerCategory[i] ?? [];
    dates.forEach((d) => {
      if (d == null) return;
      const date = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(date.getTime())) return;
      const bi = getLastFourWeeksBucketIndex(date);
      if (bi >= 0) counts[bi] += 1;
    });
    return counts;
  });
  const lastFourMonthsCounts = INCIDENT_ACTIVITY_LABELS.map((_, i) => {
    const counts = [0, 0, 0, 0];
    const dates = datesPerCategory[i] ?? [];
    dates.forEach((d) => {
      if (d == null) return;
      const date = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(date.getTime())) return;
      const bi = getLastFourMonthsBucketIndex(date);
      if (bi >= 0) counts[bi] += 1;
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
      name: 'Last 4 weeks',
      categories: getLastFourWeeksCategoryLabels(),
      data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
        name,
        data: lastFourWeeksCounts[i],
      })),
    },
    {
      name: 'Last 4 months',
      categories: getLastFourMonthsCategoryLabels(),
      data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
        name,
        data: lastFourMonthsCounts[i],
      })),
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
    name: 'Last 4 weeks',
    categories: getLastFourWeeksCategoryLabels(),
    data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
      name,
      data: [0, i % 2, 0, i % 3],
    })),
  },
  {
    name: 'Last 4 months',
    categories: getLastFourMonthsCategoryLabels(),
    data: INCIDENT_ACTIVITY_LABELS.map((name, i) => ({
      name,
      data: [i % 2, 0, i % 3, 0],
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
  subheader,
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedSeries, setSelectedSeries] = useState(chart.series[0]?.name ?? 'Last 4 weeks');
  const currentSeries = chart.series.find((i) => i.name === selectedSeries);

  const chartColors = chart.colors ?? getIncidentActivityColors(theme);

  const chartOptions = useChart({
    chart: { stacked: true, redrawOnWindowResize: true },
    colors: chartColors,
    stroke: { width: 0 },
    legend: {
      show: true,
      // Bottom legend on narrow phones only; md+ uses right legend (original desktop layout).
      position: isSmDown ? 'bottom' : 'right',
      horizontalAlign: isSmDown ? 'left' : 'right',
      floating: false,
      fontSize: isSmDown ? '10px' : '12px',
      itemMargin: isSmDown ? { horizontal: 4, vertical: 2 } : { horizontal: 6, vertical: 4 },
    },
    grid: { padding: { right: isSmDown ? 4 : 0, bottom: isSmDown ? 0 : 4 } },
    xaxis: {
      categories: currentSeries?.categories,
      labels: {
        rotate: isSmDown ? -15 : 0,
        style: { fontSize: isSmDown ? '9px' : '12px' },
        trim: isSmDown,
        hideOverlappingLabels: isSmDown,
      },
    },
    yaxis: { min: 0, max: 10, labels: { style: { fontSize: isSmDown ? '10px' : '12px' } } },
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: isSmDown ? '72%' : '64%',
        dataLabels: { position: 'center' },
      },
    },
    ...chart.options,
  });

  const handleChangeSeries = useCallback((event: { target: { value: string } }) => {
    setSelectedSeries(event.target.value);
  }, []);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        minHeight: 0,
        /** Stacked layout: content height; md+ (side-by-side with Score): match that column. */
        height: { xs: 'auto', md: '100%' },
        maxWidth: '100%',
        ...sx,
      }}
      {...other}
    >
      <CardHeader
        title={title}
        subheader={!isSmDown ? subheader : undefined}
        titleTypographyProps={{ component: 'h2', variant: isSmDown ? 'subtitle1' : 'h6' }}
        subheaderTypographyProps={{ sx: { lineHeight: 1.5 } }}
        sx={{ flexShrink: 0, px: { xs: 2, sm: 3 } }}
        action={null}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 3 },
          /** Extra space after subheader (desktop) / title (mobile) before the Period field */
          pt: { xs: 0.5, sm: 2.5 },
          pb: 1,
        }}
      >
        {isSmDown && subheader && (
          <Box sx={{ typography: 'caption', color: 'text.secondary', lineHeight: 1.4 }}>
            {subheader}
          </Box>
        )}
        <FormControl size="small" sx={{ minWidth: 140, width: { xs: '100%', sm: 200 } }}>
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
      </Stack>

      <Box
        sx={{
          pl: { xs: 0.5, sm: 1 },
          pr: { xs: 0.5, sm: 2.5 },
          pb: { xs: 1.5, sm: 2.5 },
          width: '100%',
          minHeight: 0,
          flex: { xs: 0, md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            minWidth: 0,
            minHeight: { xs: 300, md: 0 },
            flex: { md: 1 },
            display: { md: 'flex' },
            flexDirection: { md: 'column' },
            overflow: { xs: 'auto', md: 'visible' },
            WebkitOverflowScrolling: 'touch',
            px: 0.5,
          }}
        >
          <Chart
            type="bar"
            series={currentSeries?.data ?? []}
            options={chartOptions}
            slotProps={{ loading: { p: 2.5 } }}
            sx={{
              minHeight: { xs: 300, md: 0 },
              height: { xs: 300, md: '100%' },
              width: '100%',
              flex: { md: 1 },
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}
