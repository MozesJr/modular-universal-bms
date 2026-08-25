import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';

interface AccountMenuItem {
  id: number;
  label: string;
  icon: string;
  onClick?: () => void;
}

const AccountDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate(paths.signin);
  };

  const menuItems: AccountMenuItem[] = [
    {
      id: 2,
      label: 'Logout',
      icon: 'uiw:logout',
      onClick: handleLogout,
    },
  ];

  const accountMenuItems = menuItems.map((menuItem) => (
    <MenuItem
      key={menuItem.id}
      onClick={() => {
        menuItem.onClick?.();
        handleClose();
      }}
      sx={{
        '&:hover .account-menu-icon': { color: 'common.white' },
      }}
    >
      <ListItemIcon>
        <IconifyIcon
          icon={menuItem.icon}
          sx={{ color: 'primary.main' }}
          className="account-menu-icon"
        />
      </ListItemIcon>
      <Typography variant="body1">{menuItem.label}</Typography>
    </MenuItem>
  ));

  return (
    <>
      <Button
        onClick={handleClick}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ px: { xs: 1, sm: 2 }, minWidth: 'auto' }}
      >
        <Avatar
          sx={{
            width: { xs: 48, sm: 60 },
            height: { xs: 48, sm: 60 },
            borderRadius: 4,
            mr: { xs: 0, xl: 2.5 },
            bgcolor: 'primary.main',
            color: 'common.white',
            fontWeight: 600,
          }}
          alt={user?.username ?? 'User'}
        >
          {initials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Stack direction="row" alignItems="center" columnGap={6}>
            <Typography variant="h6" component="p" color="primary.darker" gutterBottom>
              {user?.username ?? 'Guest'}
            </Typography>
            <IconifyIcon icon="ph:caret-down-bold" fontSize={16} color="primary.darker" />
          </Stack>
          <Typography
            variant="subtitle2"
            textAlign="left"
            color="primary.lighter"
            sx={{ textTransform: 'capitalize' }}
          >
            {user?.role ?? ''}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {accountMenuItems}
      </Menu>
    </>
  );
};

export default AccountDropdown;
