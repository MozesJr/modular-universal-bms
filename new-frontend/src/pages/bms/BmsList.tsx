import {
  Alert,
  Box,
  Button,
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
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { useBmsList } from 'hooks/useBms';
import {
  BMS_STATUS_CHIP_COLOR,
  Bms,
  deleteBms,
  getBmsAccessLevel,
  getBmsOwnerLabel,
} from 'services/bms';
import { getErrorMessage } from 'helpers/utils';
import paths, { bmsCollaboratorsPath } from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

const BmsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bmsDevices, isLoading, error, refetch } = useBmsList();

  const handleDelete = async (bms: Bms) => {
    if (!window.confirm(`Hapus device "${bms.name}" (${bms.bms_id})?`)) return;
    try {
      await deleteBms(bms.bms_id);
      refetch();
    } catch (err) {
      window.alert(getErrorMessage(err, 'Gagal menghapus device BMS.'));
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary.dark">
          BMS Devices
        </Typography>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="mdi:plus" />}
          component={Link}
          to={paths.bmsForm}
        >
          Add Device
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refetch}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <PageLoader sx={{ height: 240 }} />
      ) : bmsDevices.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          Belum ada device BMS terdaftar.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="bms devices table">
            <TableHead>
              <TableRow>
                <TableCell>BMS ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bmsDevices.map((bms) => {
                const accessLevel = getBmsAccessLevel(
                  bms,
                  user ? { id: user.id, role: user.role } : null,
                );
                const canEdit = ['owner', 'admin', 'maintain'].includes(accessLevel);
                const canDelete = ['owner', 'admin'].includes(accessLevel);
                const canManageCollaborators = accessLevel === 'owner';

                return (
                  <TableRow key={bms._id} hover>
                    <TableCell>{bms.bms_id}</TableCell>
                    <TableCell>
                      <MuiLink
                        component={Link}
                        to={`${paths.packs}?bmsId=${bms.bms_id}`}
                        underline="hover"
                      >
                        {bms.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{bms.bms_model_name ?? '—'}</TableCell>
                    <TableCell>{bms.bms_sernum ?? '—'}</TableCell>
                    <TableCell>{getBmsOwnerLabel(bms)}</TableCell>
                    <TableCell>
                      <StatusChip
                        label={bms.status.replace(/_/g, ' ')}
                        color={BMS_STATUS_CHIP_COLOR[bms.status]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {canEdit && (
                          <Tooltip title="Edit device">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`${paths.bmsForm}?edit=${bms.bms_id}`)}
                            >
                              <IconifyIcon icon="mdi:pencil-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canManageCollaborators && (
                          <Tooltip title="Manage collaborators">
                            <IconButton
                              size="small"
                              onClick={() => navigate(bmsCollaboratorsPath(bms.bms_id))}
                            >
                              <IconifyIcon icon="mdi:account-group-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip title="Add pack to this device">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`${paths.packsForm}?bmsId=${bms.bms_id}`)}
                            >
                              <IconifyIcon icon="mdi:battery-plus-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Delete device">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(bms)}
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

export default BmsList;
