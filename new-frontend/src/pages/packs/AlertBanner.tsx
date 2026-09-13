import { Box, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface AlertBannerProps {
  severity: 'critical' | 'warning';
  issues: string[];
}

// Renders nothing when there's nothing wrong — this is deliberate: a
// persistent "all good" banner would just be decoration, and it would
// dilute the one moment this banner actually matters. Sharp corners (no
// border-radius) are also deliberate, so this reads as an interruption in
// the layout rather than another rounded card among the rest.
const AlertBanner = ({ severity, issues }: AlertBannerProps) => {
  if (issues.length === 0) return null;

  const isCritical = severity === 'critical';

  return (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        bgcolor: isCritical ? 'error.main' : 'warning.main',
        color: '#fff',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconifyIcon
          icon={isCritical ? 'mdi:alert-octagon' : 'mdi:alert'}
          sx={{ fontSize: 22, mt: '2px', flexShrink: 0 }}
        />
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          {issues.map((issue) => (
            <Typography key={issue} variant="body2" fontWeight={600} sx={{ color: 'inherit' }}>
              {issue}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default AlertBanner;
