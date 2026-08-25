import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useBmsList } from 'hooks/useBms';
import { usePacksList } from 'hooks/usePacks';
import { BMS_STATUSES, BMS_STATUS_CHIP_COLOR } from 'services/bms';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatCard from 'components/common/StatCard';
import StatusChip from 'components/common/StatusChip';

const statusLabel = (status: string) => status.replace(/_/g, ' ');

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

  const isLoading = isLoadingBms || isLoadingPacks;
  const error = bmsError ?? packsError;
  const refetch = () => {
    refetchBms();
    refetchPacks();
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
  // grouping it here client-side avoids an N+1 request per BMS device.
  const packCountByBmsId = new Map<string, number>();
  packs.forEach((pack) => {
    packCountByBmsId.set(pack.bms_id, (packCountByBmsId.get(pack.bms_id) ?? 0) + 1);
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
    <Stack spacing={4}>
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
                <StatusChip
                  key={status}
                  label={`${statusLabel(status)}: ${statusCounts.get(status)}`}
                  color={BMS_STATUS_CHIP_COLOR[status]}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

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
          {bmsDevices.map((bms) => (
            <Grid item xs={12} sm={6} md={4} key={bms._id}>
              <Paper sx={{ p: 3, height: 1 }}>
                <Stack spacing={2} height={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">{bms.name}</Typography>
                      <Typography variant="body2" color="neutral.main">
                        {bms.bms_id}
                      </Typography>
                    </Box>
                    <StatusChip
                      label={statusLabel(bms.status)}
                      color={BMS_STATUS_CHIP_COLOR[bms.status]}
                    />
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconifyIcon
                      icon="mdi:battery-charging-outline"
                      sx={{ color: 'neutral.main' }}
                    />
                    <Typography variant="body2" color="neutral.main">
                      {packCountByBmsId.get(bms.bms_id) ?? 0} pack
                      {(packCountByBmsId.get(bms.bms_id) ?? 0) === 1 ? '' : 's'}
                    </Typography>
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
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};

export default Dashboard;
