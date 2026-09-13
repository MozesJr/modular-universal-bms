import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { useBmsList } from 'hooks/useBms';
import { usePacksList } from 'hooks/usePacks';
import {
  deletePack,
  Pack,
  PACK_STATE_CHIP_COLOR,
  PACK_STATE_ICON,
  PACK_STATE_LABEL,
} from 'services/packs';
import { getBmsAccessLevel } from 'services/bms';
import { getErrorMessage } from 'helpers/utils';
import paths, { packDetailPath } from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

const MONO_SX = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: 'tabular-nums',
  // A tabular numeric column wrapping mid-value defeats the point of
  // tabular alignment — the table already scrolls horizontally
  // (see the Box overflow:auto wrapper below), so let it widen instead.
  whiteSpace: 'nowrap',
} as const;

const PacksList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const bmsIdFilter = searchParams.get('bmsId');

  const { data: packs, isLoading, error, refetch } = usePacksList();
  const { data: bmsDevices } = useBmsList();

  const bmsMap = new Map(bmsDevices.map((bms) => [bms.bms_id, bms]));
  const visiblePacks = bmsIdFilter ? packs.filter((pack) => pack.bms_id === bmsIdFilter) : packs;

  const handleDelete = async (pack: Pack) => {
    if (!window.confirm(`Hapus pack "${pack.name}" (${pack.pack_id})?`)) return;
    try {
      await deletePack(pack.pack_id);
      refetch();
    } catch (err) {
      window.alert(getErrorMessage(err, 'Gagal menghapus pack.'));
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="primary.dark">
          Packs
        </Typography>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="mdi:plus" />}
          component={Link}
          to={paths.packsForm}
        >
          Add Pack
        </Button>
      </Stack>

      {bmsIdFilter && (
        <Chip
          sx={{ mb: 2 }}
          label={`Filtered by BMS: ${bmsMap.get(bmsIdFilter)?.name ?? bmsIdFilter}`}
          onDelete={() => setSearchParams({})}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refetch}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <PageLoader sx={{ height: 240 }} />
      ) : visiblePacks.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          Belum ada pack yang bisa diakses.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="packs table">
            <TableHead>
              <TableRow>
                <TableCell>Pack ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>BMS Device</TableCell>
                <TableCell>Chemistry</TableCell>
                <TableCell align="right">Cells</TableCell>
                <TableCell align="right">Voltage</TableCell>
                <TableCell align="right">Capacity (Ah)</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visiblePacks.map((pack) => {
                const parentBms = bmsMap.get(pack.bms_id);
                const accessLevel = parentBms
                  ? getBmsAccessLevel(parentBms, user ? { id: user.id, role: user.role } : null)
                  : user?.role === 'admin'
                    ? 'admin'
                    : 'none';
                const canEdit = ['owner', 'admin', 'maintain'].includes(accessLevel);
                const canDelete = ['owner', 'admin'].includes(accessLevel);

                const stateKey = pack.state.toLowerCase();
                const isFault = stateKey === 'fault';

                return (
                  <TableRow key={pack._id} hover>
                    <TableCell
                      sx={
                        isFault
                          ? { borderLeft: '4px solid', borderLeftColor: 'error.main' }
                          : undefined
                      }
                    >
                      {pack.pack_id}
                    </TableCell>
                    <TableCell>
                      <MuiLink component={Link} to={packDetailPath(pack.pack_id)} underline="hover">
                        {pack.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{parentBms?.name ?? pack.bms_id}</TableCell>
                    <TableCell>{pack.chemistry}</TableCell>
                    <TableCell align="right" sx={MONO_SX}>
                      {pack.cell_count}
                    </TableCell>
                    <TableCell align="right" sx={MONO_SX}>
                      {(pack.nominal_voltage * pack.cell_count).toFixed(3)} V
                    </TableCell>
                    <TableCell align="right" sx={MONO_SX}>
                      {pack.capacity_ah.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      {/* variant="outlined" for the "default" (e.g.
                          standby) case — Chip color="default" in this theme
                          renders as a solid primary-teal fill (see
                          theme/palette.ts's action.selected), which would
                          make an idle state look brand-colored/active. */}
                      <StatusChip
                        label={PACK_STATE_LABEL[stateKey] ?? pack.state}
                        color={PACK_STATE_CHIP_COLOR[stateKey] ?? 'default'}
                        variant={
                          (PACK_STATE_CHIP_COLOR[stateKey] ?? 'default') === 'default'
                            ? 'outlined'
                            : 'filled'
                        }
                        icon={
                          <IconifyIcon
                            icon={PACK_STATE_ICON[stateKey] ?? 'mdi:battery-outline'}
                            sx={{ fontSize: 16 }}
                          />
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View live cells">
                          <IconButton
                            size="small"
                            onClick={() => navigate(packDetailPath(pack.pack_id))}
                          >
                            <IconifyIcon icon="mdi:pulse" />
                          </IconButton>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip title="Edit pack">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`${paths.packsForm}?edit=${pack.pack_id}`)}
                            >
                              <IconifyIcon icon="mdi:pencil-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Delete pack">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(pack)}
                            >
                              <IconifyIcon icon="mdi:trash-can-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
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

export default PacksList;
