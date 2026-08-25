import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from 'helpers/utils';
import { useBms } from 'hooks/useBms';
import { useBmsModels } from 'hooks/useBmsModels';
import { createBms, updateBms } from 'services/bms';
import paths from 'routes/paths';

const BmsForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBmsId = searchParams.get('edit');
  const isEditMode = Boolean(editBmsId);

  const { data: existingBms, isLoading: isLoadingBms } = useBms(editBmsId ?? undefined);
  const { data: bmsModels } = useBmsModels();

  const [bmsId, setBmsId] = useState('');
  const [name, setName] = useState('');
  const [bmsSernum, setBmsSernum] = useState('');
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingBms) {
      setBmsId(existingBms.bms_id);
      setName(existingBms.name);
      setBmsSernum(existingBms.bms_sernum ?? '');
      setModelName(existingBms.bms_model_name ?? '');
    }
  }, [existingBms]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditMode && editBmsId) {
        await updateBms(editBmsId, {
          name,
          bms_sernum: bmsSernum || null,
          bms_model_name: modelName || null,
        });
      } else {
        await createBms({
          bms_id: bmsId,
          name,
          bms_sernum: bmsSernum || null,
          bms_model_name: modelName || null,
        });
      }
      navigate(paths.bms);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan device BMS.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingBms) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Memuat data device...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 560 }}>
      <Typography variant="h4" color="primary.dark" mb={3}>
        {isEditMode ? 'Edit BMS Device' : 'Add BMS Device'}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="BMS ID"
            placeholder="e.g. BMS_001"
            value={bmsId}
            onChange={(event) => setBmsId(event.target.value)}
            disabled={isEditMode}
            helperText={isEditMode ? 'BMS ID tidak dapat diubah setelah dibuat.' : undefined}
            fullWidth
            required
          />

          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Serial Number"
            value={bmsSernum}
            onChange={(event) => setBmsSernum(event.target.value)}
            fullWidth
          />

          <Autocomplete
            freeSolo
            options={bmsModels.map((model) => model.model_name)}
            inputValue={modelName}
            onInputChange={(_event, value) => setModelName(value)}
            renderInput={(params) => <TextField {...params} label="Model" fullWidth />}
          />
        </Stack>

        <Stack direction="row" spacing={2} mt={3}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isEditMode ? 'Save Changes' : 'Create Device'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(paths.bms)}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default BmsForm;
