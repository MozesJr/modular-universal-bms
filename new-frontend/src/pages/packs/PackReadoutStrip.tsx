import { Box, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import StatusChip from 'components/common/StatusChip';
import { PACK_STATE_CHIP_COLOR, PACK_STATE_ICON, PACK_STATE_LABEL } from 'services/packs';

interface PackReadoutStripProps {
  state: string;
  imbalanced: boolean | null;
  avgCellVoltage: number | null;
  cellDeltaMv: number | null;
  cycleCount: number;
  lastUpdate: string | null;
}

const MONO_SX = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: 'tabular-nums',
} as const;

interface ReadoutItemProps {
  label: string;
  value: string;
  last?: boolean;
}

// A single "channel" in the strip — hairline right-border instead of a
// separate card, so the row reads as one instrument with several readouts
// rather than four unrelated widgets.
const ReadoutItem = ({ label, value, last }: ReadoutItemProps) => (
  <Box
    sx={{
      px: { xs: 1.5, sm: 2.5 },
      py: 0.5,
      borderRight: last ? 'none' : '1px solid',
      borderColor: 'neutral.dark',
    }}
  >
    <Typography
      variant="caption"
      color="neutral.main"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}
    >
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600} sx={MONO_SX}>
      {value}
    </Typography>
  </Box>
);

const PackReadoutStrip = ({
  state,
  imbalanced,
  avgCellVoltage,
  cellDeltaMv,
  cycleCount,
  lastUpdate,
}: PackReadoutStripProps) => {
  const stateKey = state.toLowerCase();
  const stateLabel = PACK_STATE_LABEL[stateKey] ?? state;
  const stateColor = PACK_STATE_CHIP_COLOR[stateKey] ?? 'default';
  const stateIcon = PACK_STATE_ICON[stateKey] ?? 'mdi:battery-outline';

  return (
    <Paper sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
      <Stack direction="row" flexWrap="wrap" rowGap={1.5} alignItems="center">
        <Box
          sx={{ px: { xs: 1.5, sm: 2.5 }, borderRight: '1px solid', borderColor: 'neutral.dark' }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {/* variant="outlined" for the "default" (e.g. standby) case —
                Chip color="default" in this theme renders as a solid
                primary-teal fill (see theme/palette.ts's action.selected),
                which would make an idle state look brand-colored/active. */}
            <StatusChip
              label={stateLabel}
              color={stateColor}
              variant={stateColor === 'default' ? 'outlined' : 'filled'}
              icon={<IconifyIcon icon={stateIcon} sx={{ fontSize: 16 }} />}
            />
            {imbalanced != null && (
              <StatusChip
                label={imbalanced ? 'Imbalanced' : 'Balanced'}
                color={imbalanced ? 'warning' : 'success'}
                icon={
                  <IconifyIcon
                    icon={imbalanced ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'}
                    sx={{ fontSize: 16 }}
                  />
                }
              />
            )}
          </Stack>
        </Box>

        <ReadoutItem
          label="Avg Cell Voltage"
          value={avgCellVoltage != null ? `${avgCellVoltage.toFixed(3)} V` : '—'}
        />
        <ReadoutItem
          label="Cell Delta"
          value={cellDeltaMv != null ? `${cellDeltaMv.toFixed(1)} mV` : '—'}
        />
        <ReadoutItem label="Life Cycle" value={`${cycleCount}`} />
        <ReadoutItem
          label="Last Update"
          value={lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}
          last
        />
      </Stack>
    </Paper>
  );
};

export default PackReadoutStrip;
