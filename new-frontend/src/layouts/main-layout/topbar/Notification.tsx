import { Badge, Button } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const Notification = () => {
  return (
    <Button
      aria-label="notifications"
      sx={{
        // Neutral container — this is a plain bell icon, not a status
        // signal, so it shouldn't borrow the warning color. The small red
        // dot below (Badge, themed in theme/components/Badge.tsx) is the
        // actual "new notification" signal and stays error-colored.
        bgcolor: 'neutral.light',
        p: { xs: 1, sm: 1.5 },
        minWidth: 'auto',
      }}
    >
      <Badge badgeContent=" " variant="dot">
        <IconifyIcon
          icon="clarity:notification-line"
          sx={{ fontSize: 24, color: 'neutral.darker' }}
        />
      </Badge>
    </Button>
  );
};

export default Notification;
