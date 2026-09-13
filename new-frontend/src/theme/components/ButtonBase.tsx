import { Components, Theme } from '@mui/material';

// Every MUI interactive control (Button, IconButton, clickable Chip,
// MenuItem, ListItemButton, ...) extends ButtonBase, which sets
// `outline: 0` on focus and expects the app to supply its own
// `.Mui-focusVisible` style. Nothing in this theme did — verified via
// devtools that a tabbed-to Button had `outline: none` and no box-shadow,
// i.e. no visible focus indicator at all. Fixing it once here covers every
// button/icon-button app-wide instead of patching each page.
const ButtonBase: Components<Omit<Theme, 'components'>>['MuiButtonBase'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-focusVisible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    }),
  },
};

export default ButtonBase;
