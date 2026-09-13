import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAlerts } from 'hooks/useAlerts';
import { useBmsList } from 'hooks/useBms';
import { usePacksList } from 'hooks/usePacks';
import { BMS_STATUSES, BMS_STATUS_CHIP_COLOR } from 'services/bms';
import { Pack } from 'services/packs';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatCard from 'components/common/StatCard';
import StatusChip from 'components/common/StatusChip';
import FleetHealthRow from './FleetHealthRow';
import PackVoltageRangeGrid from './PackVoltageRangeGrid';

const statusLabel = (status: string) => status.replace(/_/g, ' ');

// Shared with FleetHealthRow's alertsFetchLimit prop, so the "N+" fallback
// stays in sync with what was actually requested here.
const ALERTS_FETCH_LIMIT = 200;

type PackSeverity = 'critical' | 'warning' | null;

// Derived purely from data Dashboard already fetches via usePacksList() —
// `state`/`voltage_delta_mv`/`max_imbalance_mv` are REST fields, no live
// socket data needed. Mirrors the severity language already used in Pack
// Detail's AlertBanner: fault beats imbalance if both are present.
const packSeverity = (bmsPacks: Pack[]): PackSeverity => {
  let hasFault = false;
  let hasImbalance = false;
  bmsPacks.forEach((pack) => {
    if (pack.state === 'fault') hasFault = true;
    if (pack.voltage_delta_mv > pack.max_imbalance_mv) hasImbalance = true;
  });
  if (hasFault) return 'critical';
  if (hasImbalance) return 'warning';
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    data: bmsDevices,
    isLoading: isLoadingBms,
    error: bmsError,
    refetch: refetchBms,
  } = useBmsList();
  const {
    data: packs,
    isLoading: isLoadingPacks,
    error: packsError,
    refetch: refetchPacks,
  } = usePacksList();
  // Same endpoint AlertsList.tsx already uses — Fleet Health's "Active
  // Alerts" panel just needed Dashboard to also call it. A generous limit
  // since this is a fleet-wide count/breakdown, not a paginated list.
  const {
    data: alerts,
    isLoading: isLoadingAlerts,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts({ limit: ALERTS_FETCH_LIMIT });

  const isLoading = isLoadingBms || isLoadingPacks || isLoadingAlerts;
  const error = bmsError ?? packsError ?? alertsError;
  const refetch = () => {
    refetchBms();
    refetchPacks();
    refetchAlerts();
  };

  if (isLoading) {
    return <PageLoader sx={{ height: 400 }} />;
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={refetch}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  // GET /api/packs already returns every pack the user can see in one call —
  // grouping it here client-side avoids an N+1 request per BMS device. Kept
  // as full Pack objects (not just a count) so each device card can also
  // read pack state/imbalance for its severity badge.
  const packsByBmsId = new Map<string, Pack[]>();
  packs.forEach((pack) => {
    const existing = packsByBmsId.get(pack.bms_id) ?? [];
    existing.push(pack);
    packsByBmsId.set(pack.bms_id, existing);
  });

  const statusCounts = new Map<string, number>();
  bmsDevices.forEach((bms) => {
    statusCounts.set(bms.status, (statusCounts.get(bms.status) ?? 0) + 1);
  });

  if (bmsDevices.length === 0) {
    return (
      <Paper sx={{ p: 5 }}>
        <Stack alignItems="center" spacing={2} textAlign="center">
          <IconifyIcon icon="mdi:battery-outline" sx={{ fontSize: 56, color: 'neutral.main' }} />
          <Typography variant="h4" color="primary.dark">
            Belum ada BMS device
          </Typography>
          <Typography variant="body1" color="neutral.main">
            Daftarkan device BMS pertama Anda untuk mulai memantau pack dan cell-nya.
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconifyIcon icon="mdi:plus" />}
            component={Link}
            to={paths.bmsForm}
          >
            Tambah BMS
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon="mdi:battery-outline" label="Total BMS Device" value={bmsDevices.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon="mdi:battery-charging-outline"
            label="Total Pack"
            value={packs.length}
            iconColor="secondary.main"
            iconBgColor="secondary.lighter"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="neutral.main" mb={1.5}>
              Status BMS Device
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {BMS_STATUSES.filter((status) => statusCounts.has(status)).map((status) => (
                // variant="outlined" for the "default" case (e.g.
                // "rejected") — Chip color="default" in this theme renders
                // as a solid primary-teal fill (see theme/palette.ts's
                // action.selected), which would make that status look
                // brand-colored/active instead of neutral. Same fix as
                // PacksList/PackReadoutStrip/AlertsList/BmsList.
                <StatusChip
                  key={status}
                  label={`${statusLabel(status)}: ${statusCounts.get(status)}`}
                  color={BMS_STATUS_CHIP_COLOR[status]}
                  variant={BMS_STATUS_CHIP_COLOR[status] === 'default' ? 'outlined' : 'filled'}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box>
        <Typography variant="h6" mb={2}>
          Fleet Health
        </Typography>
        <FleetHealthRow packs={packs} alerts={alerts} alertsFetchLimit={ALERTS_FETCH_LIMIT} />
      </Box>

      {packs.length > 0 && (
        <Box>
          <Typography variant="h6" mb={2}>
            Pack Voltage Range
          </Typography>
          <PackVoltageRangeGrid packs={packs} />
        </Box>
      )}

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" color="primary.dark">
            BMS Devices
          </Typography>
          <Button
            variant="outlined"
            startIcon={<IconifyIcon icon="mdi:plus" />}
            component={Link}
            to={paths.bmsForm}
          >
            Add Device
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {bmsDevices.map((bms) => {
            const bmsPacks = packsByBmsId.get(bms.bms_id) ?? [];
            const severity = packSeverity(bmsPacks);
            // Device status (suspended) and pack-level severity both feed
            // the same left-bar accent — suspended always reads critical
            // regardless of its packs' own state.
            const cardSeverity: PackSeverity = bms.status === 'suspended' ? 'critical' : severity;

            return (
              <Grid item xs={12} sm={6} md={4} key={bms._id}>
                <Paper
                  sx={{
                    p: 3,
                    height: 1,
                    // Same left-bar accent as a Fault row in PacksList /
                    // CellList — one consistent "this needs attention"
                    // marker app-wide, not a new visual pattern.
                    ...(cardSeverity && {
                      borderLeft: '4px solid',
                      borderLeftColor: cardSeverity === 'critical' ? 'error.main' : 'warning.main',
                    }),
                  }}
                >
                  <Stack spacing={2} height={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6">{bms.name}</Typography>
                        <Typography variant="body2" color="neutral.main">
                          {bms.bms_id}
                        </Typography>
                      </Box>
                      {/* variant="outlined" for "rejected" (color="default")
                          — see comment on the summary chips above for why. */}
                      <StatusChip
                        label={statusLabel(bms.status)}
                        color={BMS_STATUS_CHIP_COLOR[bms.status]}
                        variant={
                          BMS_STATUS_CHIP_COLOR[bms.status] === 'default' ? 'outlined' : 'filled'
                        }
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {/* Mini version of StatCard's circular icon badge —
                          same visual language, smaller scale, so the
                          pack count reads as data rather than a caption. */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          pl: 0.5,
                          pr: 1.5,
                          py: 0.5,
                          borderRadius: 999,
                          bgcolor: 'primary.lighter',
                        }}
                      >
                        <Stack
                          alignItems="center"
                          justifyContent="center"
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'common.white',
                            flexShrink: 0,
                          }}
                        >
                          <IconifyIcon
                            icon="mdi:battery-charging-outline"
                            sx={{ fontSize: 14, color: 'primary.main' }}
                          />
                        </Stack>
                        <Typography variant="body2" color="primary.dark" fontWeight={600}>
                          {bmsPacks.length} pack{bmsPacks.length === 1 ? '' : 's'}
                        </Typography>
                      </Stack>

                      {/* Pack-level severity — separate from the device
                          status chip above, which reflects Active/Pending/
                          Suspended/Rejected, not any one pack's condition. */}
                      {severity && (
                        <StatusChip
                          label={severity === 'critical' ? 'Pack Fault' : 'Pack Imbalanced'}
                          color={severity === 'critical' ? 'error' : 'warning'}
                          icon={
                            <IconifyIcon icon="mdi:alert-circle-outline" sx={{ fontSize: 14 }} />
                          }
                        />
                      )}
                    </Stack>

                    <Box flexGrow={1} />

                    <Button
                      variant="text"
                      endIcon={<IconifyIcon icon="mdi:arrow-right" />}
                      onClick={() => navigate(`${paths.packs}?bmsId=${bms.bms_id}`)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Lihat Detail
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Stack>
  );
};

export default Dashboard;
