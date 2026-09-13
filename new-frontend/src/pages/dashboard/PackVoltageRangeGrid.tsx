import { Box, Grid, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Pack } from 'services/packs';
import { packDetailPath } from 'routes/paths';

interface PackVoltageRangeGridProps {
  packs: Pack[];
}

const MONO_SX = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: 'tabular-nums',
} as const;

// A per-pack snapshot of where its nominal voltage sits within its
// configured min–max range. NOT a time-series trend — Dashboard has no
// historical voltage data available without a new history endpoint or
// subscribing to every pack's live socket room, so this reuses the same
// already-fetched Pack REST fields as the Voltage column in PacksList
// instead of fabricating a trend line.
const PackVoltageRangeGrid = ({ packs }: PackVoltageRangeGridProps) => {
  return (
    <Grid container spacing={2}>
      {packs.map((pack) => {
        const nominalTotal = pack.nominal_voltage * pack.cell_count;
        const minTotal = pack.min_voltage * pack.cell_count;
        const maxTotal = pack.max_voltage * pack.cell_count;
        const range = maxTotal - minTotal;
        const fraction =
          range > 0 ? Math.min(1, Math.max(0, (nominalTotal - minTotal) / range)) : 0;

        return (
          <Grid item xs={12} sm={6} md={4} key={pack._id}>
            <Paper
              component={Link}
              to={packDetailPath(pack.pack_id)}
              sx={{
                p: 2,
                height: 1,
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'primary.main' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Typography variant="body2" color="neutral.main" noWrap>
                {pack.name}
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.dark" sx={MONO_SX}>
                {nominalTotal.toFixed(3)} V
              </Typography>

              <Box
                sx={{
                  position: 'relative',
                  height: 4,
                  borderRadius: 999,
                  bgcolor: 'neutral.light',
                  mt: 1.5,
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${fraction * 100}%`,
                    borderRadius: 999,
                    bgcolor: 'primary.main',
                  }}
                />
              </Box>
              <Typography variant="caption" color="neutral.main" sx={MONO_SX}>
                {minTotal.toFixed(1)} – {maxTotal.toFixed(1)} V
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PackVoltageRangeGrid;
