import { Box, Grid, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import * as echarts from 'echarts/core';
import ReactEchart from 'components/base/ReactEhart';
import IconifyIcon from 'components/base/IconifyIcon';

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
  emptyReason?: string;
}

const MONO_FONT = "'IBM Plex Mono', monospace";

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
    // Diperbaiki: Hapus titik di akhir label agar konsisten.
    { label: 'Voltage', value: voltage, max: maxVoltage, unit: 'V', decimals: 3 },
    {
      label: 'Current',
      value: current,
      max: maxCurrent,
      unit: 'A',
      decimals: 1,
      emptyReason: 'Sensor arus belum terpasang di hardware ini.',
    },
    {
      label: 'Power',
      value: power,
      max: maxPower,
      unit: 'W',
      decimals: 0,
      emptyReason: 'Butuh data arus untuk dihitung — sensor arus belum terpasang.',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ height: 1 }}>
      {gauges.map((gauge) => (
        <Grid item xs={12} sm={4} key={gauge.label} sx={{ height: 1 }}>
          <Paper
            sx={{
              p: 2,
              height: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              // Tambahkan padding bawah untuk memberi ruang lebih bagi elemen di dalamnya
              pb: 3,
            }}
          >
            <Typography variant="body2" color="neutral.main" sx={{ mb: 1.5 }}>
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
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="h5" color="neutral.main" sx={{ fontFamily: MONO_FONT }}>
                    —
                  </Typography>
                  {gauge.emptyReason && (
                    <Tooltip title={gauge.emptyReason} arrow>
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
                  {' '}
                  {/* Tambah tinggi container chart */}
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
                            width: 10, // Sedikit pertebal progress bar
                            itemStyle: { color: theme.palette.primary.main },
                          },
                          pointer: { show: false },
                          axisLine: {
                            lineStyle: {
                              width: 10, // Sedikit pertebal axis line
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
                            // PERBAIKAN UTAMA: Posisikan teks lebih ke bawah agar tidak memotong axis line.
                            // Ubah dari '10%' atau '25%' menjadi '35%' (lebih rendah).
                            offsetCenter: [0, '100%'],
                            fontSize: 18, // Pertahankan font size yang lebih besar agar jelas
                            fontWeight: 700,
                            fontFamily: MONO_FONT,
                            color: theme.palette.primary.dark,
                            // Pastikan formatter menampilkan unit juga.
                            formatter: () =>
                              `${gauge.value!.toFixed(gauge.decimals)} ${gauge.unit}`,
                          },
                          data: [{ value: gauge.value }],
                        },
                      ],
                    }}
                  />
                </Box>
                {/* Tambahkan margin top yang cukup pada keterangan range agar tidak menabrak gauge */}
                <Typography
                  variant="caption"
                  color="neutral.main"
                  sx={{ fontFamily: MONO_FONT, mt: 2, textAlign: 'center' }}
                >
                  0 – {gauge.max.toFixed(gauge.decimals)} {gauge.unit}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PackGauges;
