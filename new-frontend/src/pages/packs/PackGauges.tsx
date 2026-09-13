import { Grid } from '@mui/material';
import Gauge, { GaugeProps } from 'components/common/Gauge';

interface PackGaugesProps {
  voltage: number | null;
  current: number | null;
  power: number | null;
  maxVoltage: number;
  maxCurrent: number;
  maxPower: number;
}

const PackGauges = ({
  voltage,
  current,
  power,
  maxVoltage,
  maxCurrent,
  maxPower,
}: PackGaugesProps) => {
  const gauges: GaugeProps[] = [
    { label: 'Voltage', value: voltage, max: maxVoltage, unit: 'V', decimals: 3 },
    {
      label: 'Current',
      value: current,
      max: maxCurrent,
      unit: 'A',
      decimals: 1,
      emptyReason: 'Sensor arus belum terpasang di hardware ini.',
    },
    {
      label: 'Power',
      value: power,
      max: maxPower,
      unit: 'W',
      decimals: 0,
      emptyReason: 'Butuh data arus untuk dihitung — sensor arus belum terpasang.',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ height: 1 }}>
      {gauges.map((gauge) => (
        <Grid item xs={12} sm={4} key={gauge.label} sx={{ height: 1 }}>
          <Gauge {...gauge} />
        </Grid>
      ))}
    </Grid>
  );
};

export default PackGauges;
