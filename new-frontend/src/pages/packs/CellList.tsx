import { Divider, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { CellUpdateEvent } from 'hooks/usePackRealtime';

interface CellListProps {
  cellNumbers: number[];
  cells: Map<number, CellUpdateEvent>;
  onSelectCell: (cellNo: number) => void;
}

const CellList = ({ cellNumbers, cells, onSelectCell }: CellListProps) => {
  const mid = Math.ceil(cellNumbers.length / 2);
  const columns = [cellNumbers.slice(0, mid), cellNumbers.slice(mid)];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        Cells
      </Typography>
      <Grid container spacing={{ xs: 0, sm: 3 }}>
        {columns.map(
          (col, colIdx) =>
            col.length > 0 && (
              <Grid item xs={12} sm={6} key={colIdx}>
                <Stack divider={<Divider />}>
                  {col.map((cellNo) => (
                    <CellRow
                      key={cellNo}
                      cellNo={cellNo}
                      live={cells.get(cellNo)}
                      onClick={() => onSelectCell(cellNo)}
                    />
                  ))}
                </Stack>
              </Grid>
            ),
        )}
      </Grid>
    </Paper>
  );
};

interface CellRowProps {
  cellNo: number;
  live?: CellUpdateEvent;
  onClick: () => void;
}

const MONO_SX = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: 'tabular-nums',
} as const;

const CellRow = ({ cellNo, live, onClick }: CellRowProps) => {
  const hasAlert = Boolean(live?.alerts.length);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      onClick={onClick}
      // This row is a div, not a real <button> — role/tabIndex/onKeyDown
      // make it keyboard-operable, and the explicit focus-visible ring
      // below makes that keyboard focus actually visible (a plain div
      // gets no default browser focus outline at all).
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        py: 1.25,
        pl: hasAlert ? 1.25 : 1.5,
        pr: 1,
        cursor: 'pointer',
        // A solid left bar rather than just a tinted background — readable
        // at a glance/peripheral vision the way a real alarm panel row is,
        // not just a subtle color wash.
        borderLeft: hasAlert ? '4px solid' : 'none',
        borderLeftColor: 'error.main',
        bgcolor: hasAlert ? 'error.lighter' : 'transparent',
        '&:hover': { bgcolor: hasAlert ? 'error.lighter' : 'neutral.lighter' },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: -2,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 72 }}>
        {hasAlert && (
          <IconifyIcon icon="mdi:alert-circle" sx={{ color: 'error.main', fontSize: 16 }} />
        )}
        <Typography
          variant="body2"
          fontWeight={600}
          color={hasAlert ? 'error.dark' : 'neutral.dark'}
        >
          Cell {cellNo}
        </Typography>
      </Stack>

      {!live ? (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Skeleton variant="text" width={56} />
          <Skeleton variant="text" width={40} />
        </Stack>
      ) : (
        <Stack direction="row" spacing={3} alignItems="baseline">
          <Typography
            variant="body2"
            fontWeight={700}
            color={hasAlert ? 'error.main' : 'primary.dark'}
            sx={{ ...MONO_SX, minWidth: 64, textAlign: 'right' }}
          >
            {live.metrics.voltage.toFixed(3)} V
          </Typography>
          <Typography
            variant="body2"
            color="neutral.main"
            sx={{ ...MONO_SX, minWidth: 48, textAlign: 'right' }}
          >
            {live.metrics.temperature != null ? `${live.metrics.temperature.toFixed(1)}°C` : '—'}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default CellList;
