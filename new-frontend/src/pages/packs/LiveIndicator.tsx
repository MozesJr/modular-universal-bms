import { Box, Stack, Typography } from '@mui/material';
import { ConnectionStatus } from 'hooks/usePackRealtime';

interface LiveIndicatorProps {
  status: ConnectionStatus;
}

const LABEL: Record<ConnectionStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting…',
  disconnected: 'Disconnected',
};

const COLOR_TOKEN: Record<ConnectionStatus, 'success.main' | 'warning.main' | 'error.main'> = {
  connected: 'success.main',
  connecting: 'warning.main',
  disconnected: 'error.main',
};

const LiveIndicator = ({ status }: LiveIndicatorProps) => {
  const colorToken = COLOR_TOKEN[status];

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        px: 1.5,
        py: 0.75,
        border: '1px solid',
        borderColor: colorToken,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: colorToken,
          // The pulse only plays for the "connected" state — motion here
          // answers a real state (actively receiving live data), it's not
          // decorative, so it doesn't play for connecting/disconnected.
          // Also respects prefers-reduced-motion: the dot still shows
          // connected (solid, full-opacity) without the looping animation.
          '@media (prefers-reduced-motion: no-preference)': {
            animation: status === 'connected' ? 'live-pulse 1.6s ease-in-out infinite' : 'none',
          },
          '@keyframes live-pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.35 },
          },
        }}
      />
      <Typography variant="body2" fontWeight={700} sx={{ color: colorToken }}>
        {LABEL[status]}
      </Typography>
    </Stack>
  );
};

export default LiveIndicator;
