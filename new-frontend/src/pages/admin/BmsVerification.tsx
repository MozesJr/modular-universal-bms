import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import { useBmsList } from 'hooks/useBms';
import {
  BMS_STATUS_CHIP_COLOR,
  Bms,
  assignBms,
  getBmsOwnerLabel,
  toggleSuspendBms,
  verifyBms,
} from 'services/bms';
import { UserSummary, searchUsers } from 'services/users';
import { getErrorMessage } from 'helpers/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

const statusLabel = (status: string) => status.replace(/_/g, ' ');

const BmsVerification = () => {
  const { data: bmsDevices, isLoading, error, refetch } = useBmsList();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Bms | null>(null);

  // Pending devices need attention first — surface them at the top.
  const sortedDevices = [...bmsDevices].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === 'pending_verification') return -1;
    if (b.status === 'pending_verification') return 1;
    return 0;
  });

  const handleVerify = async (bms: Bms, decision: 'approve' | 'reject') => {
    setActionError(null);
    setSavingId(bms.bms_id);
    try {
      await verifyBms(bms.bms_id, decision);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal memproses verifikasi.'));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleSuspend = async (bms: Bms) => {
    setActionError(null);
    setSavingId(bms.bms_id);
    try {
      await toggleSuspendBms(bms.bms_id);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengubah status device.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" color="primary.dark" mb={2}>
        BMS Verification
      </Typography>

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
      ) : sortedDevices.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          Belum ada BMS device terdaftar.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="bms verification table">
            <TableHead>
              <TableRow>
                <TableCell>BMS ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDevices.map((bms) => {
                const isSaving = savingId === bms.bms_id;

                return (
                  <TableRow key={bms._id} hover>
                    <TableCell>{bms.bms_id}</TableCell>
                    <TableCell>{bms.name}</TableCell>
                    <TableCell>{getBmsOwnerLabel(bms)}</TableCell>
                    <TableCell>
                      <StatusChip
                        label={statusLabel(bms.status)}
                        color={BMS_STATUS_CHIP_COLOR[bms.status]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {bms.status === 'pending_verification' && (
                          <>
                            <Tooltip title="Approve">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={isSaving}
                                  onClick={() => handleVerify(bms, 'approve')}
                                >
                                  <IconifyIcon icon="mdi:check-circle-outline" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={isSaving}
                                  onClick={() => handleVerify(bms, 'reject')}
                                >
                                  <IconifyIcon icon="mdi:close-circle-outline" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                        {(bms.status === 'active' || bms.status === 'suspended') && (
                          <Tooltip title={bms.status === 'active' ? 'Suspend' : 'Unsuspend'}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={isSaving}
                                onClick={() => handleToggleSuspend(bms)}
                              >
                                <IconifyIcon
                                  icon={
                                    bms.status === 'active'
                                      ? 'mdi:pause-circle-outline'
                                      : 'mdi:play-circle-outline'
                                  }
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Assign owner">
                          <span>
                            <IconButton
                              size="small"
                              disabled={isSaving}
                              onClick={() => setAssignTarget(bms)}
                            >
                              <IconifyIcon icon="mdi:account-arrow-right-outline" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <AssignOwnerDialog
        bms={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={refetch}
      />
    </Paper>
  );
};

interface AssignOwnerDialogProps {
  bms: Bms | null;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignOwnerDialog = ({ bms, onClose, onAssigned }: AssignOwnerDialogProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      setResults(await searchUsers(query.trim()));
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mencari user.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async (targetUser: UserSummary) => {
    if (!bms) return;
    setError(null);
    setAssigningId(targetUser._id);
    try {
      await assignBms(bms.bms_id, targetUser._id);
      onAssigned();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal assign owner.'));
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={Boolean(bms)} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Owner — {bms?.name}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSearch}>
          <Stack direction="row" spacing={1} mb={2}>
            <TextField
              size="small"
              placeholder="Search by username or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={isSearching}>
              Search
            </Button>
          </Stack>
        </Box>

        {results.length > 0 && (
          <Table size="small" aria-label="assign owner search results">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result._id} hover>
                  <TableCell>{result.username}</TableCell>
                  <TableCell>{result.email}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={assigningId === result._id}
                      onClick={() => handleAssign(result)}
                    >
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BmsVerification;
