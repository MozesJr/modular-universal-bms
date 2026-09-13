import { Box, Grid, Paper, Stack, Typography, useTheme } from '@mui/material';
import * as echarts from 'echarts/core';
import { GaugeChart, PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEchart from 'components/base/ReactEhart';
import Gauge from 'components/common/Gauge';
import { AlertLog, AlertType, ALERT_TYPE_CHIP_COLOR, ALERT_TYPE_LABELS } from 'services/alerts';
import { Pack, PACK_STATE_LABEL } from 'services/packs';

echarts.use([GaugeChart, PieChart, TooltipComponent, CanvasRenderer]);

interface FleetHealthRowProps {
  packs: Pack[];
  alerts: AlertLog[];
  // How many alerts the caller's useAlerts({ limit }) call asked for — if
  // the response comes back at exactly that size, the true unresolved
  // count may be higher (the list API has no total-count field, only the
  // rows themselves). Used to show "200+" instead of a falsely-precise
  // "200" when the result was likely truncated.
  alertsFetchLimit: number;
}

const MONO_SX = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: 'tabular-nums',
} as const;

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

const FleetHealthRow = ({ packs, alerts, alertsFetchLimit }: FleetHealthRowProps) => {
  const theme = useTheme();

  const avgCycleCount = average(packs.map((pack) => pack.cycle_count));
  const highestCycleCount = Math.max(0, ...packs.map((pack) => pack.cycle_count));
  const cycleGaugeMax = Math.max(highestCycleCount * 1.2, 10);

  const avgVoltageDeltaMv = average(packs.map((pack) => pack.voltage_delta_mv));
  const avgMaxImbalanceMv = average(packs.map((pack) => pack.max_imbalance_mv));
  const deltaGaugeMax = Math.max(avgMaxImbalanceMv * 2, 10);

  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);
  const alertCountByType = new Map<AlertType, number>();
  unresolvedAlerts.forEach((alert) => {
    alertCountByType.set(alert.type, (alertCountByType.get(alert.type) ?? 0) + 1);
  });
  // listAlerts has no total-count field — if the fetch came back at the
  // limit, there could be more unresolved alerts than what we can see.
  const alertCountIsTruncated = alerts.length >= alertsFetchLimit;

  // Same state → color mapping as PACK_STATE_CHIP_COLOR, resolved to real
  // hex for echarts (which can't consume MUI sx tokens like 'success.main')
  // — "standby"/unmapped states go neutral grey, mirroring how that state
  // already renders as an outlined (not colored) chip elsewhere.
  const stateColorHex: Record<string, string> = {
    charging: theme.palette.info.main,
    discharging: theme.palette.warning.main,
    fault: theme.palette.error.main,
    standby: theme.palette.neutral.main,
    normal: theme.palette.success.main,
  };

  const packCountByState = new Map<string, number>();
  packs.forEach((pack) => {
    packCountByState.set(pack.state, (packCountByState.get(pack.state) ?? 0) + 1);
  });
  const stateEntries = Array.from(packCountByState.entries());

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Gauge
          label="Avg Cycle Count"
          value={packs.length > 0 ? avgCycleCount : null}
          max={cycleGaugeMax}
          unit="cyc"
          decimals={0}
          emptyReason="Belum ada pack terdaftar."
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Gauge
          label="Avg Voltage Delta"
          value={packs.length > 0 ? avgVoltageDeltaMv : null}
          max={deltaGaugeMax}
          unit="mV"
          decimals={1}
          emptyReason="Belum ada pack terdaftar."
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: 1 }}>
          <Typography variant="body2" color="neutral.main" sx={{ mb: 1 }}>
            Active Alerts
          </Typography>
          <Typography
            variant="h3"
            color={unresolvedAlerts.length > 0 ? 'error.main' : 'primary.dark'}
            sx={{ ...MONO_SX, lineHeight: 1.2 }}
          >
            {unresolvedAlerts.length}
            {alertCountIsTruncated ? '+' : ''}
          </Typography>
          {alertCountIsTruncated && (
            <Typography variant="caption" color="neutral.main">
              Lebih dari {alertsFetchLimit} — lihat halaman Alerts untuk daftar lengkap.
            </Typography>
          )}
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {Array.from(alertCountByType.entries()).map(([type, count]) => (
              <Stack key={type} direction="row" justifyContent="space-between">
                <Typography variant="caption" color="neutral.main">
                  {ALERT_TYPE_LABELS[type]}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={MONO_SX}
                  color={`${ALERT_TYPE_CHIP_COLOR[type]}.main`}
                >
                  {count}
                </Typography>
              </Stack>
            ))}
            {unresolvedAlerts.length === 0 && (
              <Typography variant="caption" color="neutral.main">
                Tidak ada alert aktif.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: 1 }}>
          <Typography variant="body2" color="neutral.main" sx={{ mb: 1 }}>
            Packs by State
          </Typography>
          {packs.length === 0 ? (
            <Box
              sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Typography variant="body2" color="neutral.main">
                —
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ height: 110 }}>
                <ReactEchart
                  echarts={echarts}
                  style={{ height: '100%', width: '100%' }}
                  option={{
                    tooltip: { trigger: 'item' },
                    series: [
                      {
                        type: 'pie',
                        radius: ['55%', '80%'],
                        avoidLabelOverlap: false,
                        label: { show: false },
                        labelLine: { show: false },
                        data: stateEntries.map(([state, count]) => ({
                          name: PACK_STATE_LABEL[state] ?? state,
                          value: count,
                          itemStyle: { color: stateColorHex[state] ?? theme.palette.neutral.main },
                        })),
                      },
                    ],
                  }}
                />
              </Box>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {stateEntries.map(([state, count]) => (
                  <Stack key={state} direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: stateColorHex[state] ?? theme.palette.neutral.main,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" color="neutral.main" sx={{ flexGrow: 1 }}>
                      {PACK_STATE_LABEL[state] ?? state}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={MONO_SX}>
                      {count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FleetHealthRow;
