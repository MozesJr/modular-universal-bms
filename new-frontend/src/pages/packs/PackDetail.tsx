import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { usePack } from 'hooks/usePacks';
import { CellUpdateEvent, ConnectionStatus, usePackRealtime } from 'hooks/usePackRealtime';
import { ALERT_TYPE_LABELS, AlertType } from 'services/alerts';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';
import ReactEchart from 'components/base/ReactEhart';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

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

      <Box>
        <Typography variant="h6" mb={2}>
          Cells
        </Typography>
        <Grid container spacing={2}>
          {cellNumbers.map((cellNo) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={cellNo}>
              <CellCard
                cellNo={cellNo}
                live={cells.get(cellNo)}
                onClick={() => setSelectedCellNo(cellNo)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

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

interface CellCardProps {
  cellNo: number;
  live?: CellUpdateEvent;
  onClick: () => void;
}

const CellCard = ({ cellNo, live, onClick }: CellCardProps) => {
  const hasAlert = Boolean(live?.alerts.length);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        border: '2px solid',
        borderColor: hasAlert ? 'error.main' : 'transparent',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="neutral.main">
          Cell {cellNo}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {hasAlert && <IconifyIcon icon="mdi:alert-circle" sx={{ color: 'error.main' }} />}
          <IconifyIcon icon="mdi:chart-line" sx={{ color: 'neutral.main', fontSize: 18 }} />
        </Stack>
      </Stack>

      {!live ? (
        <>
          <Skeleton variant="text" width="70%" height={36} />
          <Skeleton variant="text" width="50%" />
        </>
      ) : (
        <>
          <Typography variant="h5" color="primary.dark">
            {live.metrics.voltage.toFixed(3)} V
          </Typography>
          <Typography variant="body2" color="neutral.main">
            {live.metrics.temperature != null ? `${live.metrics.temperature.toFixed(1)}°C` : '—'}
            {' · SoC '}
            {live.metrics.soc != null ? `${live.metrics.soc.toFixed(0)}%` : '—'}
          </Typography>
          <Typography variant="caption" color="neutral.main">
            {new Date(live.timestamp).toLocaleTimeString()}
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default PackDetail;
