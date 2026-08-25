import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const TableRow: Components<Omit<Theme, 'components'>>['MuiTableRow'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      // action.hover/action.selected are solid brand colors in this theme,
      // not the translucent overlays MUI's own defaults assume — applied
      // as-is behind TableCell's hardcoded dark text (see TableCell.tsx),
      // that pairs dark text with a dark-blue row. Same bug class already
      // fixed for MenuItem/ListItemButton; same fix here.
      '&.MuiTableRow-hover:hover': {
        backgroundColor: theme.palette.action.hover,
        '& .MuiTableCell-root': {
          color: theme.palette.common.white,
        },
      },
      '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
        backgroundColor: theme.palette.action.selected,
        '& .MuiTableCell-root': {
          color: theme.palette.common.white,
        },
      },
    }),
  },
};

export default TableRow;
