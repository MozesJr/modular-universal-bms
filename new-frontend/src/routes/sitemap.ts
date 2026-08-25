import { SvgIconProps } from '@mui/material';
import paths, { rootPaths } from './paths';
import DashboardIcon from 'components/icons/DashboardIcon';

export interface MenuItem {
  id: number;
  name: string;
  pathName: string;
  path?: string;
  active?: boolean;
  icon?: string;
  svgIcon?: (props: SvgIconProps) => JSX.Element;
  items?: MenuItem[];
  // Hide this item from the sidebar unless the current user's role is
  // included — see SidebarContent.tsx's NavItems. The route itself is
  // still enforced separately via <ProtectedRoute roles={...}>; this is
  // just about not showing a link that would immediately redirect away.
  roles?: string[];
}

const sitemap: MenuItem[] = [
  {
    id: 1,
    name: 'Dashboard',
    path: rootPaths.root,
    pathName: 'dashboard',
    svgIcon: DashboardIcon,
    active: true,
  },
  {
    id: 2,
    name: 'BMS Devices',
    path: paths.bms,
    pathName: 'bms',
    icon: 'mdi:battery-outline',
    active: true,
  },
  {
    id: 3,
    name: 'Packs',
    path: paths.packs,
    pathName: 'packs',
    icon: 'mdi:battery-charging-outline',
    active: true,
  },
  {
    id: 4,
    name: 'Alerts',
    path: paths.alerts,
    pathName: 'alerts',
    icon: 'mdi:alert-circle-outline',
    active: true,
  },
  {
    id: 5,
    name: 'Admin',
    pathName: 'admin',
    icon: 'mdi:shield-account-outline',
    active: true,
    roles: ['admin'],
    items: [
      {
        id: 51,
        name: 'Users',
        path: paths.adminUsers,
        pathName: 'admin-users',
        active: true,
      },
      {
        id: 52,
        name: 'BMS Models',
        path: paths.adminBmsModels,
        pathName: 'admin-bms-models',
        active: true,
      },
      {
        id: 53,
        name: 'BMS Verification',
        path: paths.adminBmsVerification,
        pathName: 'admin-bms-verification',
        active: true,
      },
    ],
  },
];

export default sitemap;
