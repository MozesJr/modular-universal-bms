import { Box, List, Stack, Toolbar } from '@mui/material';
import { useAuth } from 'contexts/AuthContext';
import { useAlerts } from 'hooks/useAlerts';
import sitemap from 'routes/sitemap';
import LogoHeader from './LogoHeader';
import NavItem from './NavItem';

const NavItems = () => {
  const { user } = useAuth();
  // Sidebar lives outside the routed <Outlet>, so this only fires once per
  // session rather than on every navigation — no socket/polling needed yet.
  const { data: alerts } = useAlerts({ limit: 100 });
  const unacknowledgedCount = alerts.filter((alertLog) => !alertLog.resolved).length;

  const visibleItems = sitemap.filter(
    (navItem) => !navItem.roles || (user && navItem.roles.includes(user.role)),
  );

  return (
    <List
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {visibleItems.map((navItem) => (
        <NavItem
          key={navItem.id}
          item={navItem}
          badgeCount={navItem.pathName === 'alerts' ? unacknowledgedCount : undefined}
        />
      ))}
    </List>
  );
};

const SidebarContent = () => {
  return (
    <>
      <Toolbar disableGutters>
        <LogoHeader />
      </Toolbar>

      <Box
        sx={(theme) => ({
          px: 5,
          height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
          overflowY: 'auto',
        })}
      >
        <Stack gap={17} py={4}>
          <NavItems />
        </Stack>
      </Box>
    </>
  );
};

export default SidebarContent;
