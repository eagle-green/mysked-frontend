import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  onSliceClick?: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
  chart: {
    colors?: string[];
    series: {
      label: string;
      value: number;
      categoryKey?: string;
    }[];
    options?: ChartOptions;
  };
};

export function AttendanceConductDashboardCurrentVisits({
  title = 'Report distribution',
  subheader,
  onSliceClick,
  onPrevious,
  onNext,
  disableNext = false,
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  const fallbackColors = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.warning.light,
      theme.palette.info.dark,
      theme.palette.error.main,
    ],
    [theme]
  );

  const chartColors = chart.colors ?? fallbackColors;

  const pieItems = useMemo(
    () =>
      chart.series
        .map((item, seriesIndex) => ({ ...item, seriesIndex }))
        .filter((s) => s.value > 0),
    [chart.series]
  );

  const hasPieData = pieItems.length > 0;

  const chartSeriesValues = useMemo(() => pieItems.map((s) => s.value), [pieItems]);

  const pieLabels = useMemo(
    () => pieItems.map((s) => s.label.replace(/\n/g, ' ')),
    [pieItems]
  );

  const pieSliceColors = useMemo(
    () => pieItems.map((s) => chartColors[s.seriesIndex % chartColors.length]),
    [pieItems, chartColors]
  );

  const baseChartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: hasPieData ? pieSliceColors : chartColors,
    labels: hasPieData ? pieLabels : chart.series.map((item) => item.label.replace(/\n/g, ' ')),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    // Native Apex legend truncates long labels on narrow cards; we render a wrapping list below.
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (value: number) => fNumber(value),
        title: {
          formatter: (seriesName: string) => seriesName.replace(/\n/g, ' '),
        },
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
      <CardHeader 
        title={title} 
        subheader={
          onPrevious && onNext ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={onPrevious} sx={{ p: 0.5 }}>
                  <Iconify icon="eva:arrow-ios-back-fill" width={20} />
                </IconButton>
              </Stack>
              <Box component="span">{subheader}</Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton 
                  size="small" 
                  onClick={onNext} 
                  disabled={disableNext}
                  sx={{ p: 0.5 }}
                >
                  <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                </IconButton>
              </Stack>
            </Stack>
          ) : (
            subheader
          )
        }
      />

      <Stack spacing={2} sx={{ px: 2, pb: 2.5, pt: 0 }}>
        <Box
          sx={{
            mt: 2,
            mx: 'auto',
            width: '100%',
            maxWidth: { xs: 300, sm: 340, md: 320 },
            height: { xs: 280, sm: 300, md: 280 },
            minHeight: 260,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasPieData ? (
            <Chart
              type="pie"
              series={chartSeriesValues}
              options={chartOptions}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, textAlign: 'center' }}>
              No incidents recorded for this month
            </Typography>
          )}
        </Box>

        <Stack
          component="ul"
          spacing={1}
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            width: '100%',
          }}
        >
          {chart.series.map((item, index) => {
            const displayCount = item.value;
            const color = chartColors[index % chartColors.length];
            const labelOneLine = item.label.replace(/\s*\n\s*/g, ' ').trim();
            return (
              <Stack
                key={`${item.label}-${index}`}
                component="li"
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                  }}
                >
                  {labelOneLine}
                </Typography>
                <Typography variant="body2" sx={{ flexShrink: 0, color: 'text.secondary' }}>
                  {fNumber(Math.round(displayCount))}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
