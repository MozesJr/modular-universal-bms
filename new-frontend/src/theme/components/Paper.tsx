import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const Paper: Components<Omit<Theme, 'components'>>['MuiPaper'] = {
  defaultProps: {
    elevation: 1,
  },
  styleOverrides: {
    // Static content cards use a hairline border instead of an ambient
    // shadow — a calibrated-panel look rather than a stack of floating
    // SaaS cards. Real overlays (Dialog/Menu) use their own elevation
    // (8/24, untouched by this override) and keep MUI's default shadow.
    elevation1: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius * 1.5,
      boxShadow: 'none',
      border: `1px solid ${theme.palette.neutral.dark}`,
    }),
  },
};

export default Paper;
