import { Components, Theme } from '@mui/material';

const ListItemButton: Components<Omit<Theme, 'components'>>['MuiListItemButton'] = {
  styleOverrides: {
    gutters: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius * 4,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.common.white,
      },

      '&.Mui-selected': {
        backgroundColor: theme.palette.action.selected,
        color: theme.palette.common.white,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        // Same fix as MenuItem.tsx: MUI's own default pairs a lower-opacity
        // background with `.Mui-focusVisible` (keyboard-navigated selected
        // item) unless matched here, leaving white text on a near-white bg.
        '&.Mui-focusVisible': {
          backgroundColor: theme.palette.action.selected,
        },
      },
    }),
  },
};
export default ListItemButton;
