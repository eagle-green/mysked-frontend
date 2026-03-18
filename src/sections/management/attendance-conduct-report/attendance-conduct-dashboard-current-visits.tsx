import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  onSliceClick?: (index: number) => void;
  chart: {
    colors?: string[];
    series: {
      label: string;
      value: number;
    }[];
    options?: ChartOptions;
  };
};

export function AttendanceConductDashboardCurrentVisits({
  title = 'Report distribution',
  subheader,
  onSliceClick,
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.light,
    theme.palette.info.dark,
    theme.palette.error.main,
  ];

  const baseChartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    legend: { show: true, position: 'bottom', horizontalAlign: 'center' },
    tooltip: {
      y: {
        formatter: (value: number) => fNumber(value),
        title: { formatter: (seriesName: string) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    ...chart.options,
  });

  const chartOptions = useMemo(() => {
    if (!onSliceClick) return baseChartOptions;
    return {
      ...baseChartOptions,
      chart: {
        ...(baseChartOptions?.chart ?? {}),
        events: {
          dataPointSelection: (
            _e: unknown,
            _ctx: unknown,
            config: { dataPointIndex: number }
          ) => {
            onSliceClick(config.dataPointIndex);
          },
        },
      },
    };
  }, [baseChartOptions, onSliceClick]);

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Box
        sx={{
          my: 6,
          mx: 'auto',
          width: { xs: 340, sm: 400, xl: 440 },
          height: { xs: 340, sm: 400, xl: 440 },
          position: 'relative',
        }}
      >
        <Chart
          type="pie"
          series={chartSeries}
          options={chartOptions}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    </Card>
  );
}
