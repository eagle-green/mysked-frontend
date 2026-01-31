import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

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
  /** Optional tooltip for title; when set, a ? icon is shown next to the title */
  titleTooltip?: string;
  /** When true, positive % = bad (down arrow, red), negative % = good (up arrow, green). Use for Available metrics. */
  trendInverted?: boolean;
  chart?: {
    colors?: string[];
    categories?: string[];
    series: number[];
    options?: ChartOptions;
  };
};

export function JobWidgetSummary({ title, total, percent = 0, periodLabel = 'last 7 days', titleTooltip, trendInverted, chart, sx, ...other }: Props) {
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

    const isGood = trendInverted ? percent <= 0 : percent >= 0;
    const isUp = isGood;

    return (
      <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
        <Iconify
          width={24}
          icon={
            isUp
              ? 'solar:double-alt-arrow-up-bold-duotone'
              : 'solar:double-alt-arrow-down-bold-duotone'
          }
          sx={{
            flexShrink: 0,
            color: isGood ? 'success.main' : 'error.main',
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box sx={{ typography: 'subtitle2', whiteSpace: 'pre-line' }}>{title}</Box>
          {titleTooltip ? (
            <Tooltip title={titleTooltip} arrow placement="top">
              <IconButton size="small" sx={{ p: 0.25, mt: -0.25 }}>
                <Iconify icon="solar:info-circle-bold" width={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>

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
