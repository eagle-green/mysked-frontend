import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { Chart, useChart } from 'src/components/chart';

import { getConductScoreColor } from './conduct-score-utils';

// ----------------------------------------------------------------------

export type AttendanceConductCategoryItem = {
  name: string;
  count: number;
  /** Total points deducted from score for this category (e.g. 23 → display "(-23)") */
  deduct?: number;
};

type Props = CardProps & {
  /** Score 0–100 */
  score: number;
  /** Category counts to show under the graph (e.g. Driving Infractions — 2 / 100) */
  data?: AttendanceConductCategoryItem[];
  chart?: {
    colors?: string[];
    options?: ChartOptions;
  };
};

export function AttendanceConductScoreOverview({ score, data = [], chart, sx, ...other }: Props) {
  const theme = useTheme();
  const scoreClamped = Math.min(100, Math.max(0, score));
  const scoreColorKey = getConductScoreColor(scoreClamped);
  const scoreColor = theme.palette[scoreColorKey].main;
  const chartColors = chart?.colors ?? [scoreColor, theme.palette[scoreColorKey].light];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    stroke: { width: 0 },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: chartColors[0], opacity: 1 },
          { offset: 100, color: chartColors[1], opacity: 1 },
        ],
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 40,
        startAngle: -90,
        endAngle: 90,
        hollow: { margin: -24 },
        track: { margin: -24 },
        dataLabels: {
          name: { show: false },
          value: { show: false },
          total: { show: false },
        },
      },
    },
    ...chart?.options,
  });

  return (
    <Card sx={sx} {...other}>
      <Typography variant="subtitle1" sx={{ pt: 2, px: 3, fontWeight: 600 }}>
        Score
      </Typography>
      <Box sx={{ position: 'relative', width: 240, height: 240, mx: 'auto' }}>
        <Chart
          type="radialBar"
          series={[scoreClamped]}
          options={chartOptions}
          slotProps={{ loading: { p: 3 } }}
          sx={{ width: 240, height: 240 }}
        />
        {/* Overlay our own score text so we never show "%" (ApexCharts radialBar forces % on value) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="h3"
            component="span"
            sx={{ fontWeight: theme.typography.fontWeightBold, lineHeight: 1, color: scoreColor }}
          >
            {scoreClamped}
          </Typography>
          {/* <Typography
            variant="caption"
            sx={{ color: 'text.disabled', mt: 0.5 }}
          >
            out of 100
          </Typography> */}
        </Box>
      </Box>

      <Box
        sx={{
          px: 3,
          pb: 5,
          mt: -4,
          gap: 2,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {data.map((item) => {
          const hasDeduct = item.deduct != null && item.deduct !== 0;
          const rightText = hasDeduct
            ? `${item.count} (-${Math.abs(item.deduct!)})`
            : String(item.count);
          return (
            <Box
              key={item.name}
              sx={{
                gap: 2,
                display: 'flex',
                alignItems: 'center',
                typography: 'subtitle2',
              }}
            >
              <ListItemText
                primary={item.name}
                slotProps={{
                  secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
                }}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Box component="span" sx={{ flexShrink: 0 }}>
                {rightText}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
