import { Chip, Link, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MenuItem } from 'routes/sitemap';
import IconifyIcon from 'components/base/IconifyIcon';
import CollapsedItems from './CollapsedItems';

interface NavItemProps {
  item: MenuItem;
  badgeCount?: number;
}

const NavItem = ({ item, badgeCount }: NavItemProps) => {
  const location = useLocation();
  const { items } = item;
  // Landing directly on a child route (e.g. refreshing on /admin/users)
  // should start the group expanded instead of hiding the active link.
  const [open, setOpen] = useState(
    () => items?.some((child) => child.path === location.pathname) ?? false,
  );

  const handleCollapsedItem = () => {
    setOpen(!open);
  };

  const { name, path, icon, svgIcon: SvgIcon, active } = item;

  const Icon = icon ? (
    <IconifyIcon icon={icon} fontSize={32} />
  ) : SvgIcon ? (
    <SvgIcon sx={{ fontSize: 32 }} />
  ) : null;

  return (
    <ListItem
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        p: 0,
        opacity: active ? 1 : 0.5,
      }}
    >
      <ListItemButton
        selected={location.pathname === path}
        component={path ? Link : 'div'}
        onClick={handleCollapsedItem}
        href={path}
        sx={[
          location.pathname === path && {
            '.MuiListItemIcon-root': {
              color: 'common.white',
            },
          },
          {
            '&:hover .MuiListItemIcon-root': {
              color: 'common.white',
            },
          },
          { pl: 3, py: 2 },
        ]}
      >
        <ListItemIcon sx={{ mr: 3, color: 'primary.light', transition: 'color 0.3s' }}>
          {Icon}
        </ListItemIcon>
        <ListItemText primary={name} sx={[location.pathname === path && { fontWeight: 600 }]} />
        {badgeCount !== undefined && badgeCount > 0 && (
          <Chip
            label={badgeCount > 99 ? '99+' : badgeCount}
            color="error"
            size="small"
            sx={{ height: 20, fontSize: 11, fontWeight: 700, '& .MuiChip-label': { px: 1 } }}
          />
        )}
        {items && <IconifyIcon icon={open ? 'ph:caret-up-bold' : 'ph:caret-down-bold'} />}
      </ListItemButton>

      {items && <CollapsedItems items={items} open={open} />}
    </ListItem>
  );
};

export default NavItem;
