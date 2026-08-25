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
import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePack } from 'hooks/usePacks';
import { CellUpdateEvent, ConnectionStatus, usePackRealtime } from 'hooks/usePackRealtime';
import { ALERT_TYPE_LABELS, AlertType } from 'services/alerts';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

// echarts pulls in a lot of code even tree-shaken — load it only once a
// user actually clicks a cell, not as part of this page's own chunk, so
// the live snapshot view (this page's core purpose) stays fast to load.
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

const PackDetail = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const { data: pack, isLoading, error, refetch } = usePack(packId);
  const { cells, connectionStatus, latestAlert } = usePackRealtime(packId);

  const [alertToastOpen, setAlertToastOpen] = useState(false);
  const [selectedCellNo, setSelectedCellNo] = useState<number | null>(null);

  useEffect(() => {
    if (latestAlert) setAlertToastOpen(true);
  }, [latestAlert]);

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

  const cellNumbers = [...pack.cells.map((cell) => cell.cell_no)].sort((a, b) => a - b);

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
