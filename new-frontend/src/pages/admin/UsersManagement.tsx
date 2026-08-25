import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
import { useAuth } from 'contexts/AuthContext';
import { useAdminUsers } from 'hooks/useAdminUsers';
import {
  AdminUser,
  UserRole,
  createAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
} from 'services/adminUsers';
import { getErrorMessage } from 'helpers/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';
import StatusChip from 'components/common/StatusChip';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error, refetch } = useAdminUsers();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

  const handleRoleChange = async (targetUser: AdminUser, role: UserRole) => {
    setActionError(null);
    setSavingId(targetUser._id);
    try {
      await updateAdminUser(targetUser._id, { role });
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengubah role user.'));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (targetUser: AdminUser) => {
    setActionError(null);
    setSavingId(targetUser._id);
    try {
      await updateAdminUser(targetUser._id, { isActive: !targetUser.isActive });
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengubah status user.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="primary.dark">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="mdi:plus" />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add User
        </Button>
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
      ) : users.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          Belum ada user terdaftar.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>BMS Owned</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((targetUser) => {
                const isSelf = targetUser._id === currentUser?.id;
                const isSaving = savingId === targetUser._id;

                return (
                  <TableRow key={targetUser._id} hover>
                    <TableCell>{targetUser.username}</TableCell>
                    <TableCell>{targetUser.email}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={targetUser.role}
                        disabled={isSelf || isSaving}
                        onChange={(event) =>
                          handleRoleChange(targetUser, event.target.value as UserRole)
                        }
                      >
                        <MenuItem value="user">user</MenuItem>
                        <MenuItem value="admin">admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={targetUser.isActive ? 'Active' : 'Suspended'}
                        color={targetUser.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{targetUser.bmsCount}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip
                          title={
                            isSelf
                              ? 'Tidak bisa mengubah status akun sendiri'
                              : targetUser.isActive
                                ? 'Suspend user'
                                : 'Activate user'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={isSelf || isSaving}
                              onClick={() => handleToggleActive(targetUser)}
                            >
                              <IconifyIcon
                                icon={
                                  targetUser.isActive
                                    ? 'mdi:account-off-outline'
                                    : 'mdi:account-check-outline'
                                }
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reset password">
                          <IconButton
                            size="small"
                            disabled={isSaving}
                            onClick={() => setResetTarget(targetUser)}
                          >
                            <IconifyIcon icon="mdi:lock-reset" />
                          </IconButton>
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

      <AddUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={refetch}
      />
      <ResetPasswordDialog
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onReset={refetch}
      />
    </Paper>
  );
};

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddUserDialog = ({ open, onClose, onCreated }: AddUserDialogProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createAdminUser({ username, email, password, role });
      onCreated();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal membuat user.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              helperText="Minimal 8 karakter"
              fullWidth
              required
            />
            <Select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              <MenuItem value="user">user</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Create
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

interface ResetPasswordDialogProps {
  user: AdminUser | null;
  onClose: () => void;
  onReset: () => void;
}

const ResetPasswordDialog = ({ user, onClose, onReset }: ResetPasswordDialogProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setNewPassword('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await resetAdminUserPassword(user._id, newPassword);
      onReset();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(user)} onClose={handleClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Reset Password — {user?.username}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              helperText="Minimal 8 karakter"
              autoFocus
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Reset Password
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UsersManagement;
