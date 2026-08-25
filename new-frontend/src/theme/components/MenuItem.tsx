import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const MenuItem: Components<Omit<Theme, 'components'>>['MuiMenuItem'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      '&:hover': { color: theme.palette.common.white },
      '&.Mui-selected': {
        backgroundColor: theme.palette.action.selected,
        color: theme.palette.common.white,
      },
      // MUI's own MenuItem default styles set a *lower*-opacity background
      // for `.Mui-selected.Mui-focusVisible` (the combo an open Select's
      // pre-selected item gets automatically) without touching text color —
      // left unmatched here, that default wins over the rule above and pairs
      // white text with a near-white background.
      '&.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
        backgroundColor: theme.palette.action.selected,
        color: theme.palette.common.white,
      },
    }),
  },
};

export default MenuItem;
