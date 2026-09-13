import { Box, Paper, Typography, useTheme } from '@mui/material';

interface BatteryVisualProps {
  soc: number | null;
}

type SocStatus = 'success' | 'warning' | 'error' | 'neutral';

const socStatus = (soc: number | null): SocStatus => {
  if (soc == null) return 'neutral';
  if (soc >= 50) return 'success';
  if (soc >= 20) return 'warning';
  return 'error';
};

// Geometry of the battery outline drawn below, in the SVG's own viewBox units.
const BODY_X = 16;
const BODY_Y = 22;
const BODY_W = 68;
const BODY_H = 148;
const PAD = 6;

const BatteryVisual = ({ soc }: BatteryVisualProps) => {
  const theme = useTheme();
  const status = socStatus(soc);
  const fillColor = status === 'neutral' ? theme.palette.neutral.light : theme.palette[status].main;
  const clamped = soc == null ? 0 : Math.min(100, Math.max(0, soc));

  const innerH = BODY_H - PAD * 2;
  const fillH = (innerH * clamped) / 100;
  const fillY = BODY_Y + PAD + (innerH - fillH);

  return (
    <Paper
      sx={{
        p: 3,
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="body2" color="neutral.main" mb={2}>
        Pack SOC
      </Typography>
      <Box sx={{ position: 'relative', width: 100, height: 180 }}>
        <svg viewBox="0 0 100 180" width={100} height={180}>
          <rect x={38} y={2} width={24} height={16} rx={4} fill={theme.palette.neutral.light} />
          <rect
            x={BODY_X}
            y={BODY_Y}
            width={BODY_W}
            height={BODY_H}
            rx={16}
            fill={theme.palette.neutral.lighter}
            stroke={theme.palette.neutral.light}
            strokeWidth={5}
          />
          {soc != null && (
            <rect
              x={BODY_X + PAD}
              y={fillY}
              width={BODY_W - PAD * 2}
              height={Math.max(fillH, 0)}
              rx={10}
              fill={fillColor}
            />
          )}
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary.dark"
            sx={{ textShadow: '0 0 6px rgba(255,255,255,0.9)' }}
          >
            {soc != null ? `${soc.toFixed(0)}%` : '—'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BatteryVisual;
