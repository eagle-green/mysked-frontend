import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { alpha, useTheme } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  onBarClick?: (dataPointIndex: number, seriesIndex: number) => void;
  chart: {
    colors?: string[];
    categories?: string[];
    series: {
      name: string;
      data: number[];
    }[];
    options?: ChartOptions;
  };
};

export function AttendanceConductDashboardWebsiteVisits({
  title = 'Reports over time',
  subheader,
  onBarClick,
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [
    alpha(theme.palette.primary.main, 0.8),
    alpha(theme.palette.warning.main, 0.8),
  ];

  const baseChartOptions = useChart({
    colors: chartColors,
    stroke: { width: 2, colors: ['transparent'] },
    xaxis: { categories: chart.categories },
    legend: { show: true },
    tooltip: { y: { formatter: (value: number) => `${value} reports` } },
    ...chart.options,
  });

  const chartOptions = useMemo(() => {
    if (!onBarClick) return baseChartOptions;
    return {
      ...baseChartOptions,
      chart: {
        ...(baseChartOptions?.chart ?? {}),
        events: {
          dataPointSelection: (
            _e: unknown,
            _ctx: unknown,
            config: { dataPointIndex: number; seriesIndex: number }
          ) => {
            onBarClick(config.dataPointIndex, config.seriesIndex ?? 0);
          },
        },
      },
    };
  }, [baseChartOptions, onBarClick]);

  return (
    <Card
      sx={[{ display: 'flex', flexDirection: 'column', height: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <CardHeader title={title} subheader={subheader} sx={{ flexShrink: 0 }} />

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
          series={chart.series}
          options={chartOptions}
          slotProps={{ loading: { p: 2.5 } }}
          sx={{
            flex: 1,
            minHeight: { xs: 340, sm: 400, xl: 440 },
            pt: 2.5,
          }}
        />
      </Box>
    </Card>
  );
}
