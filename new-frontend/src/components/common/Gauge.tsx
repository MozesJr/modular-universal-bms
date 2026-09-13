import { Box, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import * as echarts from 'echarts/core';
import ReactEchart from 'components/base/ReactEhart';
import IconifyIcon from 'components/base/IconifyIcon';

export interface GaugeProps {
  label: string;
  value: number | null;
  max: number;
  unit: string;
  decimals: number;
  // Shown as a tooltip next to the "—" placeholder when value is null and
  // the reason isn't just "no data yet" — e.g. no sensor exists at all, so
  // it never will populate. Keeps an empty reading from looking like a bug.
  emptyReason?: string;
}

const MONO_FONT = "'IBM Plex Mono', monospace";

// Single gauge panel — extracted from Pack Detail's PackGauges so the same
// half-donut gauge (with its min–max range caption and empty/tooltip
// state) can be reused for Dashboard's Fleet Health panels without
// duplicating the echarts config.
const Gauge = ({ label, value, max, unit, decimals, emptyReason }: GaugeProps) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pb: 3,
      }}
    >
      <Typography variant="body2" color="neutral.main" sx={{ mb: 1.5 }}>
        {label}
      </Typography>
      {value == null ? (
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="h5" color="neutral.main" sx={{ fontFamily: MONO_FONT }}>
              —
            </Typography>
            {emptyReason && (
              <Tooltip title={emptyReason} arrow>
                <Box
                  component="span"
                  tabIndex={0}
                  sx={{
                    display: 'inline-flex',
                    cursor: 'help',
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                      borderRadius: '50%',
                    },
                  }}
                >
                  <IconifyIcon
                    icon="mdi:information-outline"
                    sx={{ fontSize: 16, color: 'neutral.main' }}
                  />
                </Box>
              </Tooltip>
            )}
          </Stack>
        </Box>
      ) : (
        <>
          <Box sx={{ width: '100%', height: 140, mb: 1 }}>
            <ReactEchart
              echarts={echarts}
              style={{ height: '100%', width: '100%' }}
              option={{
                series: [
                  {
                    type: 'gauge',
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: max > 0 ? max : 1,
                    progress: {
                      show: true,
                      width: 10,
                      itemStyle: { color: theme.palette.primary.main },
                    },
                    pointer: { show: false },
                    axisLine: {
                      lineStyle: {
                        width: 10,
                        color: [
                          [0.3, theme.palette.error.light],
                          [0.7, theme.palette.warning.light],
                          [1, theme.palette.success.light],
                        ],
                      },
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    anchor: { show: false },
                    title: { show: false },
                    detail: {
                      valueAnimation: true,
                      offsetCenter: [0, '100%'],
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: MONO_FONT,
                      color: theme.palette.primary.dark,
                      formatter: () => `${value.toFixed(decimals)} ${unit}`,
                    },
                    data: [{ value }],
                  },
                ],
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="neutral.main"
            sx={{ fontFamily: MONO_FONT, mt: 2, textAlign: 'center' }}
          >
            0 – {max.toFixed(decimals)} {unit}
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default Gauge;
