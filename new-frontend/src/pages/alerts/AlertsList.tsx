import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from 'contexts/AuthContext';
import { useAlerts } from 'hooks/useAlerts';
import { useBmsList } from 'hooks/useBms';
import { usePacksList } from 'hooks/usePacks';
import {
  ALERT_TYPE_CHIP_COLOR,
  ALERT_TYPE_LABELS,
  acknowledgeAlert,
  AlertLog,
} from 'services/alerts';
import { getBmsAccessLevel } from 'services/bms';
import { getErrorMessage } from 'helpers/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

type StatusFilter = 'all' | 'unresolved' | 'resolved';

const AlertsList = () => {
  const { user } = useAuth();
  const { data: alerts, isLoading, error, refetch } = useAlerts({ limit: 100 });
  const { data: bmsDevices } = useBmsList();
  const { data: packs } = usePacksList();

  const [bmsFilter, setBmsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const bmsMap = new Map(bmsDevices.map((bms) => [bms.bms_id, bms]));
  const packMap = new Map(packs.map((pack) => [pack.pack_id, pack]));

  const visibleAlerts = alerts.filter((alertLog) => {
    if (statusFilter === 'unresolved' && alertLog.resolved) return false;
    if (statusFilter === 'resolved' && !alertLog.resolved) return false;
    if (bmsFilter) {
      const pack = packMap.get(alertLog.pack_id);
      if (!pack || pack.bms_id !== bmsFilter) return false;
    }
    return true;
  });

  const handleAcknowledge = async (alertLog: AlertLog) => {
    setActionError(null);
    setAcknowledgingId(alertLog._id);
    try {
      await acknowledgeAlert(alertLog._id);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal acknowledge alert.'));
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="primary.dark">
          Alerts
        </Typography>
        <Button variant="outlined" startIcon={<IconifyIcon icon="mdi:refresh" />} onClick={refetch}>
          Refresh
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="alerts-bms-filter-label">BMS Device</InputLabel>
          <Select
            labelId="alerts-bms-filter-label"
            label="BMS Device"
            value={bmsFilter}
            onChange={(event) => setBmsFilter(event.target.value)}
          >
            <MenuItem value="">All devices</MenuItem>
            {bmsDevices.map((bms) => (
              <MenuItem key={bms.bms_id} value={bms.bms_id}>
                {bms.name} ({bms.bms_id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="alerts-status-filter-label">Status</InputLabel>
          <Select
            labelId="alerts-status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unresolved">Unacknowledged</MenuItem>
            <MenuItem value="resolved">Acknowledged</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refetch}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {isLoading ? (
        <PageLoader sx={{ height: 240 }} />
      ) : visibleAlerts.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          {alerts.length === 0 ? 'Belum ada alert.' : 'Tidak ada alert yang sesuai filter.'}
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="alerts table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>BMS Device</TableCell>
                <TableCell>Pack</TableCell>
                <TableCell>Cell</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleAlerts.map((alertLog) => {
                const pack = packMap.get(alertLog.pack_id);
                const bms = pack ? bmsMap.get(pack.bms_id) : undefined;
                const accessLevel = bms
                  ? getBmsAccessLevel(bms, user ? { id: user.id, role: user.role } : null)
                  : user?.role === 'admin'
                    ? 'admin'
                    : 'none';
                const canAcknowledge = ['owner', 'admin', 'maintain'].includes(accessLevel);

                return (
                  <TableRow key={alertLog._id} hover>
                    <TableCell>{new Date(alertLog.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{bms?.name ?? pack?.bms_id ?? '—'}</TableCell>
                    <TableCell>{pack?.name ?? alertLog.pack_id}</TableCell>
                    <TableCell>{alertLog.cell_id === 0 ? 'Pack' : alertLog.cell_id}</TableCell>
                    <TableCell>
                      <StatusChip
                        label={ALERT_TYPE_LABELS[alertLog.type]}
                        color={ALERT_TYPE_CHIP_COLOR[alertLog.type]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={alertLog.resolved ? 'Acknowledged' : 'Unacknowledged'}
                        color={alertLog.resolved ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!alertLog.resolved && canAcknowledge && (
                        <Tooltip title="Acknowledge alert">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleAcknowledge(alertLog)}
                              disabled={acknowledgingId === alertLog._id}
                            >
                              <IconifyIcon icon="mdi:check-circle-outline" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
};

export default AlertsList;
