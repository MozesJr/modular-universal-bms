import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'label' | 'color'> {
  label: string;
  color: ChipProps['color'];
}

const StatusChip = ({ label, color, ...rest }: StatusChipProps) => {
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
      {...rest}
    />
  );
};

export default StatusChip;
