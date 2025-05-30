import type { IAddressItem } from 'src/types/common';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { provinceList } from 'src/assets/data/assets';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  list: IAddressItem[];
  action?: React.ReactNode;
  selected: (selectedId: string) => boolean;
  onSelect: (address: IAddressItem | null) => void;
};

export function AddressListDialog({
  list,
  open,
  action,
  onClose,
  selected,
  onSelect,
  title = 'Address book',
}: Props) {
  const [searchAddress, setSearchAddress] = useState('');

  const dataFiltered = applyFilter({ inputData: list, query: searchAddress });

  const notFound = !dataFiltered.length && !!searchAddress;

  const handleSearchAddress = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAddress(event.target.value);
  }, []);

  const handleSelectAddress = useCallback(
    (address: IAddressItem | null) => {
      onSelect(address);
      setSearchAddress('');
      onClose();
    },
    [onClose, onSelect]
  );

  const renderList = () => (
    <Scrollbar sx={{ p: 0.5, maxHeight: 480 }}>
      {dataFiltered.map((address) => (
        <ButtonBase
          key={address.id}
          onClick={() => handleSelectAddress(address)}
          sx={{
            py: 1,
            my: 0.5,
            px: 1.5,
            gap: 0.5,
            width: 1,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            ...(selected(`${address.id}`) && { bgcolor: 'action.selected' }),
          }}
        >
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            {address.type === 'client' && (
              <Avatar
                src={address.logo_url ?? undefined}
                alt={address.name}
                sx={{ width: 28, height: 28 }}
              >
                {address.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Typography variant="subtitle2">{address.name}</Typography>

            {address.primary && <Label color="info">Default</Label>}
          </Box>

          {address.company && (
            <Box sx={{ color: 'primary.main', typography: 'caption' }}>{address.company}</Box>
          )}

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'left', width: '100%' }}
          >
            {(() => {
              if (!address.fullAddress) return '';
              let addr = address.fullAddress;
              provinceList.forEach(({ value, code }) => {
                addr = addr.replace(value, code);
              });
              return addr;
            })()}
          </Typography>

          {address.phoneNumber && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', textAlign: 'left', width: '100%' }}
            >
              {formatPhoneNumberSimple(address.phoneNumber)}
            </Typography>
          )}
        </ButtonBase>
      ))}
    </Scrollbar>
  );

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <Box
        sx={{
          p: 3,
          pr: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6"> {title} </Typography>

        {action && action}
      </Box>

      <Stack sx={{ p: 2, pt: 0 }}>
        <TextField
          value={searchAddress}
          onChange={handleSearchAddress}
          placeholder="Search..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {notFound ? (
        <SearchNotFound query={searchAddress} sx={{ px: 3, pt: 5, pb: 10 }} />
      ) : (
        renderList()
      )}
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  query: string;
  inputData: IAddressItem[];
};

function applyFilter({ inputData, query }: ApplyFilterProps) {
  if (!query) {
    return inputData;
  }

  return inputData.filter(({ name, company, fullAddress, phoneNumber }) =>
    [name, company, fullAddress, phoneNumber].some((field) =>
      field?.toLowerCase().includes(query.toLowerCase())
    )
  );
}

function getProvinceCode(provinceName: string) {
  const found = provinceList.find((p) => p.value === provinceName);
  return found ? found.code : provinceName;
}

function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 10)} ${digits.slice(10)}`.trim();
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
