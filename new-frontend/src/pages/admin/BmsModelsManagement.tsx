import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
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
import { useBmsModels } from 'hooks/useBmsModels';
import { BmsModel, createBmsModel, deleteBmsModel, updateBmsModel } from 'services/bmsModels';
import { getErrorMessage } from 'helpers/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import PageLoader from 'components/loading/PageLoader';

const BmsModelsManagement = () => {
  const { data: models, isLoading, error, refetch } = useBmsModels();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<BmsModel | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const startEdit = (model: BmsModel) => {
    setEditingModel(model);
    setEditValue(model.model_name);
  };

  const cancelEdit = () => {
    setEditingModel(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingModel) return;
    setActionError(null);
    setSavingId(editingModel._id);
    try {
      await updateBmsModel(editingModel._id, editValue);
      refetch();
      cancelEdit();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengubah model.'));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (model: BmsModel) => {
    if (!window.confirm(`Hapus model "${model.model_name}"?`)) return;
    setActionError(null);
    setSavingId(model._id);
    try {
      await deleteBmsModel(model._id);
      refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal menghapus model.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="primary.dark">
          BMS Models
        </Typography>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="mdi:plus" />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Model
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
      ) : models.length === 0 ? (
        <Typography variant="body1" color="neutral.main" textAlign="center" py={5}>
          Belum ada BMS model terdaftar.
        </Typography>
      ) : (
        <Box sx={{ overflow: 'auto' }}>
          <Table aria-label="bms models table">
            <TableHead>
              <TableRow>
                <TableCell>Model Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => {
                const isEditing = editingModel?._id === model._id;
                const isSaving = savingId === model._id;

                return (
                  <TableRow key={model._id} hover>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          autoFocus
                          fullWidth
                        />
                      ) : (
                        model.model_name
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {isEditing ? (
                          <>
                            <Tooltip title="Save">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isSaving || !editValue.trim()}
                                  onClick={saveEdit}
                                >
                                  <IconifyIcon icon="mdi:content-save-outline" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={cancelEdit}>
                                <IconifyIcon icon="mdi:close" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Rename model">
                              <IconButton
                                size="small"
                                disabled={isSaving}
                                onClick={() => startEdit(model)}
                              >
                                <IconifyIcon icon="mdi:pencil-outline" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete model">
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isSaving}
                                onClick={() => handleDelete(model)}
                              >
                                <IconifyIcon icon="mdi:trash-can-outline" />
                              </IconButton>
                            </Tooltip>
                          </>
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

      <AddBmsModelDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={refetch}
      />
    </Paper>
  );
};

interface AddBmsModelDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddBmsModelDialog = ({ open, onClose, onCreated }: AddBmsModelDialogProps) => {
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setModelName('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createBmsModel(modelName);
      onCreated();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal membuat model.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add BMS Model</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Model Name"
              placeholder="e.g. ESP32-BMS-V3"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              autoFocus
              fullWidth
              required
            />
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

export default BmsModelsManagement;
