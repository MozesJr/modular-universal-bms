import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import * as echarts from 'echarts/core';
import ReactEchart from 'components/base/ReactEhart';

interface PackGaugesProps {
  voltage: number | null;
  current: number | null;
  power: number | null;
  maxVoltage: number;
  maxCurrent: number;
  maxPower: number;
}

interface GaugeSpec {
  label: string;
  value: number | null;
  max: number;
  unit: string;
  decimals: number;
}

const PackGauges = ({
  voltage,
  current,
  power,
  maxVoltage,
  maxCurrent,
  maxPower,
}: PackGaugesProps) => {
  const theme = useTheme();

  const gauges: GaugeSpec[] = [
    { label: 'Voltage', value: voltage, max: maxVoltage, unit: 'V', decimals: 2 },
    { label: 'Current', value: current, max: maxCurrent, unit: 'A', decimals: 1 },
    { label: 'Power', value: power, max: maxPower, unit: 'W', decimals: 0 },
  ];

  return (
    <Grid container spacing={2} sx={{ height: 1 }}>
      {gauges.map((gauge) => (
        <Grid item xs={4} key={gauge.label} sx={{ height: 1 }}>
          <Paper
            sx={{
              p: 2,
              height: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="neutral.main">
              {gauge.label}
            </Typography>
            {gauge.value == null ? (
              <Box
                sx={{
                  flexGrow: 1,
                  minHeight: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h5" color="neutral.main">
                  —
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 120 }}>
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
                        max: gauge.max > 0 ? gauge.max : 1,
                        progress: {
                          show: true,
                          width: 8,
                          itemStyle: { color: theme.palette.primary.main },
                        },
                        pointer: { show: false },
                        axisLine: {
                          lineStyle: {
                            width: 8,
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
                          offsetCenter: [0, '10%'],
                          fontSize: 18,
                          fontWeight: 700,
                          color: theme.palette.primary.dark,
                          formatter: () => `${gauge.value!.toFixed(gauge.decimals)} ${gauge.unit}`,
                        },
                        data: [{ value: gauge.value }],
                      },
                    ],
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PackGauges;
