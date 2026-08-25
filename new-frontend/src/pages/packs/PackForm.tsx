import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { getErrorMessage } from 'helpers/utils';
import { useBmsList } from 'hooks/useBms';
import { usePack } from 'hooks/usePacks';
import { getBmsAccessLevel } from 'services/bms';
import { PACK_CHEMISTRIES, PackChemistry, createPack, updatePack } from 'services/packs';
import paths from 'routes/paths';

const numberField = (value: string) => (value === '' ? undefined : Number(value));

const PackForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editPackId = searchParams.get('edit');
  const prefillBmsId = searchParams.get('bmsId');
  const isEditMode = Boolean(editPackId);

  const { data: existingPack, isLoading: isLoadingPack } = usePack(editPackId ?? undefined);
  const { data: bmsDevices } = useBmsList();

  const editableBmsDevices = bmsDevices.filter((bms) =>
    ['owner', 'admin', 'maintain'].includes(
      getBmsAccessLevel(bms, user ? { id: user.id, role: user.role } : null),
    ),
  );

  const [bmsId, setBmsId] = useState(prefillBmsId ?? '');
  const [packId, setPackId] = useState('');
  const [name, setName] = useState('');
  const [cellCount, setCellCount] = useState('1');
  const [chemistry, setChemistry] = useState<PackChemistry>('LiFePO4');
  const [capacityAh, setCapacityAh] = useState('100');
  const [nominalVoltage, setNominalVoltage] = useState('3.2');
  const [minVoltage, setMinVoltage] = useState('2.5');
  const [maxVoltage, setMaxVoltage] = useState('3.65');
  const [maxTempCelsius, setMaxTempCelsius] = useState('60');
  const [maxCurrentAmps, setMaxCurrentAmps] = useState('20');
  const [maxImbalanceMv, setMaxImbalanceMv] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingPack) {
      setBmsId(existingPack.bms_id);
      setPackId(existingPack.pack_id);
      setName(existingPack.name);
      setCellCount(String(existingPack.cell_count));
      setChemistry(existingPack.chemistry);
      setCapacityAh(String(existingPack.capacity_ah));
      setNominalVoltage(String(existingPack.nominal_voltage));
      setMinVoltage(String(existingPack.min_voltage));
      setMaxVoltage(String(existingPack.max_voltage));
      setMaxTempCelsius(String(existingPack.max_temp_celsius));
      setMaxCurrentAmps(String(existingPack.max_current_amps));
      setMaxImbalanceMv(String(existingPack.max_imbalance_mv));
    }
  }, [existingPack]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        cell_count: Number(cellCount),
        chemistry,
        capacity_ah: numberField(capacityAh),
        nominal_voltage: numberField(nominalVoltage),
        min_voltage: numberField(minVoltage),
        max_voltage: numberField(maxVoltage),
        max_temp_celsius: numberField(maxTempCelsius),
        max_current_amps: numberField(maxCurrentAmps),
        max_imbalance_mv: numberField(maxImbalanceMv),
      };
      if (isEditMode && editPackId) {
        await updatePack(editPackId, payload);
      } else {
        await createPack({ ...payload, pack_id: packId, bms_id: bmsId });
      }
      navigate(bmsId ? `${paths.packs}?bmsId=${bmsId}` : paths.packs);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan pack.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberChange =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) =>
      setter(event.target.value);

  if (isEditMode && isLoadingPack) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Memuat data pack...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h4" color="primary.dark" mb={1}>
        {isEditMode ? 'Edit Pack' : 'Add Pack'}
      </Typography>
      {!isEditMode && (
        <Typography variant="body2" color="neutral.main" mb={2}>
          Mengubah "Cell Count" akan meregenerasi seluruh daftar cell pack ini di backend.
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="BMS Device"
              value={bmsId}
              onChange={(event) => setBmsId(event.target.value)}
              disabled={isEditMode}
              helperText={isEditMode ? 'Device tidak dapat diubah setelah pack dibuat.' : undefined}
              fullWidth
              required
            >
              {editableBmsDevices.length === 0 && (
                <MenuItem value="" disabled>
                  Tidak ada device yang bisa diakses
                </MenuItem>
              )}
              {editableBmsDevices.map((bms) => (
                <MenuItem key={bms.bms_id} value={bms.bms_id}>
                  {bms.name} ({bms.bms_id})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Pack ID"
              placeholder="e.g. PACK_001"
              value={packId}
              onChange={(event) => setPackId(event.target.value)}
              disabled={isEditMode}
              helperText={isEditMode ? 'Pack ID tidak dapat diubah setelah dibuat.' : undefined}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Chemistry"
              value={chemistry}
              onChange={(event) => setChemistry(event.target.value as PackChemistry)}
              fullWidth
            >
              {PACK_CHEMISTRIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Cell Count"
              type="number"
              value={cellCount}
              onChange={handleNumberChange(setCellCount)}
              inputProps={{ min: 1 }}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Capacity (Ah)"
              type="number"
              value={capacityAh}
              onChange={handleNumberChange(setCapacityAh)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nominal Voltage (V)"
              type="number"
              value={nominalVoltage}
              onChange={handleNumberChange(setNominalVoltage)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Min Voltage (V)"
              type="number"
              value={minVoltage}
              onChange={handleNumberChange(setMinVoltage)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Voltage (V)"
              type="number"
              value={maxVoltage}
              onChange={handleNumberChange(setMaxVoltage)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Temperature (°C)"
              type="number"
              value={maxTempCelsius}
              onChange={handleNumberChange(setMaxTempCelsius)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Current (A)"
              type="number"
              value={maxCurrentAmps}
              onChange={handleNumberChange(setMaxCurrentAmps)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Imbalance (mV)"
              type="number"
              value={maxImbalanceMv}
              onChange={handleNumberChange(setMaxImbalanceMv)}
              fullWidth
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} mt={3}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || (!isEditMode && (!bmsId || !packId))}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isEditMode ? 'Save Changes' : 'Create Pack'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(paths.packs)}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default PackForm;
