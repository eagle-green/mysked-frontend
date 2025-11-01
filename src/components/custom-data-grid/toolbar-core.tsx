import type { ButtonProps } from '@mui/material/Button';
import type { Theme, SxProps } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';
import type { IconButtonProps } from '@mui/material/IconButton';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import {
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

type BaseProps = Partial<ButtonProps & IconButtonProps>;

export type ToolbarButtonBaseProps = BaseProps & {
  label?: string;
  showLabel?: boolean;
  icon: React.ReactNode;
};

export function ToolbarButtonBase({
  sx,
  label,
  icon,
  showLabel = true,
  ...other
}: ToolbarButtonBaseProps) {
  const Component: React.ElementType = showLabel ? Button : IconButton;

  const baseProps: BaseProps = showLabel ? { size: 'small' } : {};

  return (
    <Tooltip title={label}>
      <Component
        {...baseProps}
        {...other}
        sx={[
          {
            gap: showLabel ? 0.75 : 0,
            '& svg': {
              width: showLabel ? 18 : 20,
              height: showLabel ? 18 : 20,
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {icon}
        {showLabel && label}
      </Component>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------

export function CustomToolbarColumnsButton({
  showLabel,
}: Pick<ToolbarButtonBaseProps, 'showLabel'>) {
  return <GridToolbarColumnsButton slotProps={{ button: { size: 'small' } }} />;
}

// ----------------------------------------------------------------------

export function CustomToolbarFilterButton({
  showLabel,
}: Pick<ToolbarButtonBaseProps, 'showLabel'>) {
  return <GridToolbarFilterButton slotProps={{ button: { size: 'small' } }} />;
}

// ----------------------------------------------------------------------

export function CustomToolbarExportButton({
  showLabel,
}: Pick<ToolbarButtonBaseProps, 'showLabel'>) {
  return (
    <GridToolbarExport
      slotProps={{
        button: { size: 'small' },
      }}
    />
  );
}

// ----------------------------------------------------------------------

export type CustomToolbarQuickFilterProps = {
  sx?: SxProps<Theme>;
  slotProps?: {
    textField?: TextFieldProps;
  };
};

export function CustomToolbarQuickFilter({
  sx,
  slotProps,
}: CustomToolbarQuickFilterProps) {
  return (
    <Box sx={[{ width: 1, maxWidth: { md: 260 } }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <GridToolbarQuickFilter
        slotProps={{
          baseTextField: {
            size: 'small',
            placeholder: 'Search...',
            InputProps: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            },
            ...slotProps?.textField,
          },
        } as any}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export const ToolbarContainer = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    alignItems: 'center',
    flexDirection: 'row',
  },
}));

export const ToolbarLeftPanel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}));

export const ToolbarRightPanel = styled('div')(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
}));

