import type { BoxProps } from '@mui/material/Box';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type InvoiceTotalSummaryProps = BoxProps & {
  subtotal?: number;
  discount?: number;
  discountType?: 'percent' | 'value';
  tax?: number;
  totalAmount?: number;
};

export function InvoiceTotalSummary({
  sx,
  subtotal,
  discount,
  discountType = 'percent',
  tax,
  totalAmount,
  ...other
}: InvoiceTotalSummaryProps) {
  const rowStyles: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyles: SxProps<Theme> = {
    color: 'text.secondary',
  };

  const valueStyles: SxProps<Theme> = {
    width: 160,
  };

  return (
    <Box
      sx={[
        {
          mt: 3,
          gap: 2,
          display: 'flex',
          textAlign: 'right',
          typography: 'body2',
          alignItems: 'flex-end',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Subtotal
        </Box>
        <Box component="span" sx={[valueStyles, { fontWeight: 'fontWeightSemiBold' }]}>
          {fCurrency(subtotal) || '-'}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Discount
        </Box>
        <Box component="span" sx={[{ ...valueStyles }, !!discount && { color: 'error.main' }]}>
          {discount ? `- ${fCurrency(discount)}` : '-'}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Tax
        </Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(tax) || '-'}
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">Total</Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalAmount) || '-'}
        </Box>
      </Box>
    </Box>
  );
}

