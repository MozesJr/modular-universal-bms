import {
  Alert,
  Box,
  Button,
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
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { getErrorMessage } from 'helpers/utils';
import { useBms } from 'hooks/useBms';
import {
  CollaboratorPermission,
  addOrUpdateCollaborator,
  getBmsAccessLevel,
  removeCollaborator,
} from 'services/bms';
import { UserSummary, searchUsers } from 'services/users';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';

const Collaborators = () => {
  const { bmsId } = useParams<{ bmsId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bms, isLoading, error: loadError, refetch } = useBms(bmsId);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setActionError(null);
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mencari user.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (targetUser: UserSummary, permission: CollaboratorPermission) => {
    if (!bmsId) return;
    setActionError(null);
    try {
      await addOrUpdateCollaborator(bmsId, targetUser._id, permission);
      setSearchResults([]);
      setSearchQuery('');
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal menambahkan collaborator.'));
    }
  };

  const handlePermissionChange = async (
    collaboratorId: string,
    permission: CollaboratorPermission,
  ) => {
    if (!bmsId) return;
    setActionError(null);
    try {
      await addOrUpdateCollaborator(bmsId, collaboratorId, permission);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengubah permission.'));
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!bmsId) return;
    if (!window.confirm('Hapus collaborator ini?')) return;
    setActionError(null);
    try {
      await removeCollaborator(bmsId, collaboratorId);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal menghapus collaborator.'));
    }
  };

  if (isLoading) {
    return <PageLoader sx={{ height: 320 }} />;
  }

  if (loadError || !bms) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{loadError ?? 'Device BMS tidak ditemukan.'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(paths.bms)}>
          Back to BMS Devices
        </Button>
      </Paper>
    );
  }

  const accessLevel = getBmsAccessLevel(bms, user ? { id: user.id, role: user.role } : null);
  const canManage = accessLevel === 'owner';

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" color="primary.dark">
        Collaborators — {bms.name}
      </Typography>
      <Typography variant="body2" color="neutral.main" mb={3}>
        {bms.bms_id}
      </Typography>

      {!canManage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Anda hanya bisa melihat daftar ini. Hanya owner device yang dapat menambah, mengubah, atau
          menghapus collaborator.
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Typography variant="h6" mb={1}>
        Current collaborators
      </Typography>
      {bms.collaborators.length === 0 ? (
        <Typography variant="body2" color="neutral.main" mb={3}>
          Belum ada collaborator.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto', mb: 3 }}>
          <Table aria-label="collaborators table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>Permission</TableCell>
                {canManage && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {bms.collaborators.map((collaborator) => (
                <TableRow key={collaborator.user} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{collaborator.user}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        size="small"
                        value={collaborator.permission}
                        onChange={(event) =>
                          handlePermissionChange(
                            collaborator.user,
                            event.target.value as CollaboratorPermission,
                          )
                        }
                      >
                        <MenuItem value="view">view</MenuItem>
                        <MenuItem value="maintain">maintain</MenuItem>
                      </Select>
                    ) : (
                      collaborator.permission
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <Tooltip title="Remove collaborator">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemove(collaborator.user)}
                        >
                          <IconifyIcon icon="mdi:trash-can-outline" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {canManage && (
        <>
          <Typography variant="h6" mb={1}>
            Add collaborator
          </Typography>
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Search by username or email"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSearching}>
                Search
              </Button>
            </Stack>
          </Box>

          {searchResults.length > 0 && (
            <Table aria-label="user search results" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Add as</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((result) => (
                  <SearchResultRow key={result._id} result={result} onAdd={handleAdd} />
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Paper>
  );
};

interface SearchResultRowProps {
  result: UserSummary;
  onAdd: (user: UserSummary, permission: CollaboratorPermission) => void;
}

const SearchResultRow = ({ result, onAdd }: SearchResultRowProps) => {
  const [permission, setPermission] = useState<CollaboratorPermission>('view');

  return (
    <TableRow hover>
      <TableCell>{result.username}</TableCell>
      <TableCell>{result.email}</TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Select
            size="small"
            value={permission}
            onChange={(event) => setPermission(event.target.value as CollaboratorPermission)}
          >
            <MenuItem value="view">view</MenuItem>
            <MenuItem value="maintain">maintain</MenuItem>
          </Select>
          <Button size="small" variant="outlined" onClick={() => onAdd(result, permission)}>
            Add
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default Collaborators;
