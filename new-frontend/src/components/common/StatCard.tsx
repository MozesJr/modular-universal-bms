import { Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  iconColor?: string;
  iconBgColor?: string;
}

const StatCard = ({
  icon,
  label,
  value,
  iconColor = 'primary.main',
  // Not primary.lighter: theme/colors.ts's indigo[50] is a mid-tone
  // grey-violet rather than a pale tint (the scale doesn't follow the usual
  // 50=lightest convention), so it renders as a muddy box instead of a tint.
  iconBgColor = 'neutral.lighter',
}: StatCardProps) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: iconBgColor, flexShrink: 0 }}
        >
          <IconifyIcon icon={icon} sx={{ color: iconColor, fontSize: 24 }} />
        </Stack>
        <Stack>
          <Typography variant="h4" color="primary.dark">
            {value}
          </Typography>
          <Typography variant="body2" color="neutral.main">
            {label}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default StatCard;
