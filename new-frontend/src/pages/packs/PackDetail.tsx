import { Alert, Box, Button, Grid, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as echarts from 'echarts/core';
import { GaugeChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { usePack } from 'hooks/usePacks';
import { CellUpdateEvent, ConnectionStatus, usePackRealtime } from 'hooks/usePackRealtime';
import { ALERT_TYPE_LABELS, AlertType } from 'services/alerts';
import paths from 'routes/paths';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';
import StatCard from 'components/common/StatCard';
import ReactEchart from 'components/base/ReactEhart';
import BatteryVisual from './BatteryVisual';
import PackGauges from './PackGauges';
import PackStatusRow from './PackStatusRow';
import CellList from './CellList';

echarts.use([
  LineChart,
  GaugeChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

// Modal per-cell tetap lazy -- meski echarts core sekarang sudah ke-load
// duluan lewat grafik gabungan di halaman ini, komponen dialog-nya sendiri
// (JSX, hook history, dsb) tetap masuk chunk terpisah dan baru diambil
// saat user benar-benar klik salah satu cell.
const CellHistoryDialog = lazy(() => import('./CellHistoryDialog'));

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting…',
  disconnected: 'Disconnected',
};

const CONNECTION_COLOR: Record<ConnectionStatus, 'success' | 'warning' | 'error'> = {
  connected: 'success',
  connecting: 'warning',
  disconnected: 'error',
};

const alertLabel = (type: string) => ALERT_TYPE_LABELS[type as AlertType] ?? type;

// Berapa banyak titik terakhir yang disimpan per series sebelum yang lama dibuang.
const MAX_POINTS = 300;

type TimeSeriesPoint = [number, number]; // [timestamp_ms, value]

const PackDetail = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const { data: pack, isLoading, error, refetch } = usePack(packId);
  const { cells, connectionStatus, latestAlert } = usePackRealtime(packId);

  const [alertToastOpen, setAlertToastOpen] = useState(false);
  const [selectedCellNo, setSelectedCellNo] = useState<number | null>(null);

  // ── Buffer grafik gabungan (live only, direset tiap ganti pack) ────────
  const [cellVoltageSeries, setCellVoltageSeries] = useState<Record<number, TimeSeriesPoint[]>>({});
  const [totalVoltageSeries, setTotalVoltageSeries] = useState<TimeSeriesPoint[]>([]);
  const lastSeenTimestampRef = useRef<Record<number, string | null>>({});

  useEffect(() => {
    if (latestAlert) setAlertToastOpen(true);
  }, [latestAlert]);

  const cellNumbers = useMemo(
    () => (pack ? [...pack.cells.map((cell) => cell.cell_no)].sort((a, b) => a - b) : []),
    [pack],
  );

  // Reset buffer grafik setiap pindah pack, supaya data pack lama tidak nyangkut.
  useEffect(() => {
    setCellVoltageSeries({});
    setTotalVoltageSeries([]);
    lastSeenTimestampRef.current = {};
  }, [packId]);

  // Setiap ada event baru dari salah satu cell, tambahkan titik ke buffer
  // cell tersebut, lalu hitung ulang total voltage pack dari snapshot
  // terbaru SEMUA cell (kalau semuanya sudah pernah melapor minimal sekali).
  useEffect(() => {
    if (cellNumbers.length === 0) return;

    let anyNewPoint = false;

    cellNumbers.forEach((cellNo) => {
      const event = cells.get(cellNo);
      if (!event) return;
      if (lastSeenTimestampRef.current[cellNo] === event.timestamp) return;

      lastSeenTimestampRef.current[cellNo] = event.timestamp;
      anyNewPoint = true;

      setCellVoltageSeries((prev) => {
        const existing = prev[cellNo] ?? [];
        const next = [
          ...existing,
          [new Date(event.timestamp).getTime(), event.metrics.voltage],
        ] as TimeSeriesPoint[];
        if (next.length > MAX_POINTS) next.shift();
        return { ...prev, [cellNo]: next };
      });
    });

    if (!anyNewPoint) return;

    // Total pack voltage = jumlah voltage terbaru dari tiap cell, dihitung
    // ulang tiap kali salah satu cell update -- baru dicatat kalau semua
    // cell sudah pernah melapor minimal sekali sejak halaman dibuka.
    let total = 0;
    let latestTimestampMs = 0;
    const allReported = cellNumbers.every((cellNo) => {
      const event = cells.get(cellNo);
      if (!event) return false;
      total += event.metrics.voltage;
      latestTimestampMs = Math.max(latestTimestampMs, new Date(event.timestamp).getTime());
      return true;
    });

    if (allReported) {
      setTotalVoltageSeries((prev) => {
        const next = [...prev, [latestTimestampMs, total]] as TimeSeriesPoint[];
        if (next.length > MAX_POINTS) next.shift();
        return next;
      });
    }
  }, [cells, cellNumbers]);

  const hasChartData = totalVoltageSeries.length > 0 || Object.keys(cellVoltageSeries).length > 0;

  // Most recent event across ALL cells (not just one) — pack_metrics, state,
  // imbalance and voltage delta are computed server-side and stamped on
  // every cell event identically, so any one of them reflects the pack as
  // a whole as of that timestamp.
  const latestEvent = useMemo<CellUpdateEvent | null>(() => {
    let latest: CellUpdateEvent | null = null;
    for (const event of cells.values()) {
      if (!latest || new Date(event.timestamp).getTime() > new Date(latest.timestamp).getTime()) {
        latest = event;
      }
    }
    return latest;
  }, [cells]);

  const avgCellVoltage = useMemo(() => {
    if (cells.size === 0) return null;
    let sum = 0;
    cells.forEach((event) => {
      sum += event.metrics.voltage;
    });
    return sum / cells.size;
  }, [cells]);

  // Fallback average of per-cell SoC — the ESP32 firmware
  // (bms-esp32-node/src/main.cpp) never publishes a pack-level `pack_soc`,
  // so `pack_metrics.soc` from the backend is always null for this
  // hardware. Per-cell `metrics.soc` is never null though: the backend
  // OCV-estimates it from cell voltage whenever the device doesn't report
  // one (see estimateSocFromVoltage in backend/src/services/bmsAlgorithm.js),
  // so this average is real derived data, not a placeholder.
  const avgCellSoc = useMemo(() => {
    let sum = 0;
    let count = 0;
    cells.forEach((event) => {
      if (event.metrics.soc != null) {
        sum += event.metrics.soc;
        count += 1;
      }
    });
    return count > 0 ? sum / count : null;
  }, [cells]);

  const packSoc = latestEvent?.pack_metrics.soc ?? avgCellSoc;
  // Same reasoning as avgCellSoc: firmware never sends `pack_voltage`, so
  // fall back to the same cell-voltage sum already computed for the
  // chart's "Total (V)" line (only populated once every cell has reported).
  const derivedPackVoltage =
    totalVoltageSeries.length > 0 ? totalVoltageSeries[totalVoltageSeries.length - 1][1] : null;
  const packVoltage = latestEvent?.pack_metrics.voltage ?? derivedPackVoltage;
  // Current has no fallback: the firmware has no current sensor at all, so
  // unlike voltage/SoC there is no real per-cell data to derive it from —
  // showing "—" here is honest, not a bug. Faking a value (e.g. 0) would be
  // actively misleading, so this intentionally stays null until the
  // hardware/firmware actually measures current.
  const packCurrent = latestEvent?.pack_metrics.current ?? null;
  // Derived from voltage/current above, so it only ever resolves once
  // current is real — i.e. never, on hardware without a current sensor.
  const packPower = packVoltage != null && packCurrent != null ? packVoltage * packCurrent : null;
  const packImbalanced = latestEvent?.pack_imbalanced ?? null;
  const cellDeltaMv = latestEvent?.pack_voltage_delta_mv ?? null;
  const lastUpdate = latestEvent?.timestamp ?? null;
  // No live event yet right after opening the page: fall back to the
  // pack's last known REST state instead of leaving the status row blank.
  const packStateLabel = latestEvent?.state ?? pack?.state ?? 'normal';

  const gaugeRanges = useMemo(() => {
    const maxVoltage = pack ? pack.max_voltage * pack.cell_count : 0;
    const maxCurrent = pack?.max_current_amps ?? 0;
    return { maxVoltage, maxCurrent, maxPower: maxVoltage * maxCurrent };
  }, [pack]);

  const overviewOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: {
        data: [...cellNumbers.map((n) => `Cell ${n} (V)`), 'Total (V)'],
      },
      grid: { left: 55, right: 20, top: 45, bottom: 30 },
      xAxis: { type: 'time' },
      yAxis: [{ type: 'value', name: 'V', scale: true }],
      series: [
        ...cellNumbers.map((cellNo) => ({
          name: `Cell ${cellNo} (V)`,
          type: 'line',
          showSymbol: false,
          data: cellVoltageSeries[cellNo] ?? [],
        })),
        {
          name: 'Total (V)',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 3, type: 'dashed' },
          data: totalVoltageSeries,
        },
      ],
    }),
    [cellNumbers, cellVoltageSeries, totalVoltageSeries],
  );

  if (isLoading) {
    return <PageLoader sx={{ height: 320 }} />;
  }

  if (error || !pack) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refetch}>Retry</Button>}>
          {error ?? 'Pack tidak ditemukan.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(paths.packs)}>
          Back to Packs
        </Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" color="primary.dark">
              {pack.name}
            </Typography>
            <Typography variant="body2" color="neutral.main">
              {pack.pack_id} · {pack.chemistry} · {pack.cell_count} cells
            </Typography>
          </Box>
          <StatusChip
            label={CONNECTION_LABEL[connectionStatus]}
            color={CONNECTION_COLOR[connectionStatus]}
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <BatteryVisual soc={packSoc} />
        </Grid>
        <Grid item xs={12} md={8}>
          <PackGauges
            voltage={packVoltage}
            current={packCurrent}
            power={packPower}
            maxVoltage={gaugeRanges.maxVoltage}
            maxCurrent={gaugeRanges.maxCurrent}
            maxPower={gaugeRanges.maxPower}
          />
        </Grid>
      </Grid>

      <PackStatusRow state={packStateLabel} imbalanced={packImbalanced} />

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon="mdi:battery-outline"
            label="Avg Cell Voltage"
            value={avgCellVoltage != null ? `${avgCellVoltage.toFixed(3)} V` : '—'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon="mdi:swap-vertical"
            label="Cell Delta"
            value={cellDeltaMv != null ? `${cellDeltaMv.toFixed(1)} mV` : '—'}
            iconColor="secondary.main"
            iconBgColor="secondary.lighter"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon="mdi:refresh"
            label="Life Cycle"
            value={pack.cycle_count}
            iconColor="success.main"
            iconBgColor="success.lighter"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon="mdi:clock-outline"
            label="Last Update"
            value={lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}
            iconColor="warning.main"
            iconBgColor="warning.lighter"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={0.5}>
          Voltage Overview (Live)
        </Typography>
        <Typography variant="caption" color="neutral.main" mb={2} display="block">
          Menampilkan histori sejak halaman ini dibuka -- reload akan mengosongkan grafik.
        </Typography>

        {!hasChartData ? (
          <Box
            sx={{
              height: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="neutral.main">
              Menunggu data live masuk…
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 320 }}>
            <ReactEchart
              echarts={echarts}
              option={overviewOption}
              style={{ height: '100%', width: '100%' }}
            />
          </Box>
        )}
      </Paper>

      <CellList cellNumbers={cellNumbers} cells={cells} onSelectCell={setSelectedCellNo} />

      {selectedCellNo !== null && (
        <Suspense fallback={null}>
          <CellHistoryDialog
            packId={pack.pack_id}
            cellNo={selectedCellNo}
            liveEvent={cells.get(selectedCellNo)}
            onClose={() => setSelectedCellNo(null)}
          />
        </Suspense>
      )}

      <Snackbar
        open={alertToastOpen}
        autoHideDuration={6000}
        onClose={() => setAlertToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setAlertToastOpen(false)}>
          {latestAlert &&
            `Cell ${latestAlert.cell_id === 0 ? '(pack)' : latestAlert.cell_id}: ${latestAlert.alerts.map(alertLabel).join(', ')}`}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default PackDetail;
