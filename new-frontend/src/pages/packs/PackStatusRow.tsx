import { ChipProps, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import StatusChip from 'components/common/StatusChip';

interface PackStatusRowProps {
  state: string;
  imbalanced: boolean | null;
}

const STATE_LABEL: Record<string, string> = {
  charging: 'Charging',
  discharging: 'Discharging',
  fault: 'Fault',
  standby: 'Standby',
  normal: 'Normal',
};

const STATE_COLOR: Record<string, ChipProps['color']> = {
  charging: 'info',
  discharging: 'warning',
  fault: 'error',
  standby: 'default',
  normal: 'success',
};

const STATE_ICON: Record<string, string> = {
  charging: 'mdi:battery-charging-outline',
  discharging: 'mdi:battery-arrow-down-outline',
  fault: 'mdi:alert-circle-outline',
  standby: 'mdi:battery-outline',
  normal: 'mdi:battery-outline',
};

const PackStatusRow = ({ state, imbalanced }: PackStatusRowProps) => {
  const stateKey = state.toLowerCase();
  const label = STATE_LABEL[stateKey] ?? state;
  const color = STATE_COLOR[stateKey] ?? 'default';
  const icon = STATE_ICON[stateKey] ?? 'mdi:battery-outline';

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="neutral.main">
          Status
        </Typography>
        <StatusChip
          label={label}
          color={color}
          icon={<IconifyIcon icon={icon} sx={{ fontSize: 16 }} />}
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
    </Paper>
  );
};

export default PackStatusRow;
