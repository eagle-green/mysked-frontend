import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { Chart, useChart } from 'src/components/chart';

import { getConductScoreColor } from './conduct-score-utils';

// ----------------------------------------------------------------------

export type AttendanceConductCategoryItem = {
  name: string;
  count: number;
  /** Total points deducted from score for this category (e.g. 23 → displayed as "(-23)") */
  deduct?: number;
};

export type AttendanceConductPositiveItem = {
  name: string;
  /** Points earned (positive number). */
  points: number;
  /** Whether this is a live automated bonus (true) or a permanent manual award (false). */
  auto?: boolean;
};

type Props = CardProps & {
  /** Actual score (can exceed 100 when earn-back pushes it above base). */
  score: number;
  /** Deduction category items — shown on the "-" tab. */
  data?: AttendanceConductCategoryItem[];
  /** Earn-back items — shown on the "+" tab. */
  positiveData?: AttendanceConductPositiveItem[];
  chart?: {
    colors?: string[];
    options?: ChartOptions;
  };
};

export function AttendanceConductScoreOverview({
  score,
  data = [],
  positiveData = [],
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'+' | '-'>('-');

  // Chart always fills 0-100 visually; score text shows the real value.
  const chartPercent = Math.min(100, Math.max(0, score));
  const scoreColorKey = getConductScoreColor(chartPercent);
  const scoreColor = theme.palette[scoreColorKey].main;
  const chartColors = chart?.colors ?? [scoreColor, theme.palette[scoreColorKey].light];

  const totalDeduct = data.reduce((s, i) => s + (i.deduct ?? 0), 0);
  const totalEarnBack = positiveData.reduce((s, i) => s + i.points, 0);

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

      {/* Radial chart + score number */}
      <Box sx={{ position: 'relative', width: 240, height: 240, mx: 'auto' }}>
        <Chart
          type="radialBar"
          series={[chartPercent]}
          options={chartOptions}
          slotProps={{ loading: { p: 3 } }}
          sx={{ width: 240, height: 240 }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
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
            {score}
          </Typography>
          {score > 100 && (
            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, fontWeight: 600 }}>
              +{score - 100} above base
            </Typography>
          )}
          {score < 0 && (
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, fontWeight: 600 }}>
              {score} below zero
            </Typography>
          )}
        </Box>
      </Box>

      {/* +/- tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={[
          (t) => ({
            mx: 2,
            mt: -3,
            mb: 0,
            borderRadius: 1,
            minHeight: 36,
            bgcolor: t.palette.background.neutral ?? t.palette.grey[100],
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 13 },
          }),
        ]}
      >
        <Tab
          value="-"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>Deductions</span>
              {totalDeduct > 0 && (
                <Chip
                  label={`-${totalDeduct}`}
                  size="small"
                  color="error"
                  variant={activeTab === '-' ? 'filled' : 'soft'}
                  sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                />
              )}
            </Box>
          }
        />
        <Tab
          value="+"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>Bonuses</span>
              {totalEarnBack > 0 && (
                <Chip
                  label={`+${totalEarnBack}`}
                  size="small"
                  color="success"
                  variant={activeTab === '+' ? 'filled' : 'soft'}
                  sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                />
              )}
            </Box>
          }
        />
      </Tabs>

      {/* List under tabs */}
      <Box sx={{ px: 3, pb: 5, mt: 2, gap: 1.5, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === '-' && (
          <>
            {data.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 1 }}>
                No deductions
              </Typography>
            ) : (
              data.map((item) => {
                const hasDeduct = item.deduct != null && item.deduct !== 0;
                return (
                  <Box
                    key={item.name}
                    sx={{ gap: 2, display: 'flex', alignItems: 'center', typography: 'subtitle2' }}
                  >
                    <ListItemText
                      primary={item.name}
                      slotProps={{
                        secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
                      }}
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    <Box component="span" sx={{ flexShrink: 0, color: hasDeduct ? 'error.main' : 'text.primary' }}>
                      {hasDeduct
                        ? `${item.count} (-${Math.abs(item.deduct!)})`
                        : String(item.count)}
                    </Box>
                  </Box>
                );
              })
            )}
          </>
        )}

        {activeTab === '+' && (
          <>
            {positiveData.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 1 }}>
                No earn-back points yet
              </Typography>
            ) : (
              positiveData.map((item, idx) => (
                <Box
                  key={`${item.name}-${idx}`}
                  sx={{ gap: 2, display: 'flex', alignItems: 'center', typography: 'subtitle2' }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={item.auto ? 'Auto' : 'Award'}
                    slotProps={{
                      secondary: { sx: { mt: 0.25, typography: 'caption', color: 'text.disabled' } },
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <Box component="span" sx={{ flexShrink: 0, color: 'success.main', fontWeight: 700 }}>
                    +{item.points}
                  </Box>
                </Box>
              ))
            )}
          </>
        )}
      </Box>
    </Card>
  );
}
