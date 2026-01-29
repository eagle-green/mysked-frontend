import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total: number;
  percent?: number;
  /** Label shown next to the percent trend, e.g. "last 7 days" or "Last 4 weeks" */
  periodLabel?: string;
  chart?: {
    colors?: string[];
    categories?: string[];
    series: number[];
    options?: ChartOptions;
  };
};

export function JobWidgetSummary({ title, total, percent = 0, periodLabel = 'last 7 days', chart, sx, ...other }: Props) {
  const theme = useTheme();

  const chartColors = chart?.colors ?? [theme.palette.primary.main];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    stroke: { width: 0 },
    xaxis: { categories: chart?.categories },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    plotOptions: { bar: { borderRadius: 1.5, columnWidth: '64%' } },
    ...chart?.options,
  });

  const renderTrending = () => {
    if (percent === undefined || percent === null) return null;

    return (
      <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
        <Iconify
          width={24}
          icon={
            percent < 0
              ? 'solar:double-alt-arrow-down-bold-duotone'
              : 'solar:double-alt-arrow-up-bold-duotone'
          }
          sx={{
            flexShrink: 0,
            color: 'success.main',
            ...(percent < 0 && { color: 'error.main' }),
          }}
        />

        <Box component="span" sx={{ typography: 'subtitle2', flexShrink: 0 }}>
          {percent > 0 && '+'}
          {fPercent(percent)}
        </Box>

        <Box
          component="span"
          sx={{ typography: 'body2', color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {periodLabel}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      sx={[
        () => ({
          p: 3,
          display: 'flex',
          zIndex: 'unset',
          overflow: 'unset',
          alignItems: 'center',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ typography: 'subtitle2' }}>{title}</Box>

        <Box sx={{ mt: 1.5, mb: 1, typography: 'h3' }}>{fNumber(total)}</Box>

        {renderTrending()}
      </Box>

      {chart?.series && chart.series.length > 0 && (
        <Chart
          type="bar"
          series={[{ data: chart.series }]}
          options={chartOptions}
          sx={{ width: 60, height: 40, flexShrink: 0 }}
        />
      )}
    </Card>
  );
}
