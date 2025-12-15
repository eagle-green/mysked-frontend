import type { IInvoice } from 'src/types/invoice';
import type { DialogProps } from '@mui/material/Dialog';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

type AddressItem = IInvoice['invoiceTo'];

type Props = Omit<DialogProps, 'onSelect'> & {
  title?: string;
  list: AddressItem[];
  action?: React.ReactNode;
  onClose: () => void;
  selected: (selectedId: string) => boolean;
  onSelect: (address: AddressItem | null) => void;
};

export function AddressListDialog({
  sx,
  open,
  list,
  action,
  onClose,
  selected,
  onSelect,
  title = 'Address book',
  ...other
}: Props) {
  const [searchAddress, setSearchAddress] = useState('');

  const dataFiltered = applyFilter({ inputData: list, query: searchAddress });

  const notFound = !dataFiltered.length && !!searchAddress;

  const handleSearchAddress = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAddress(event.target.value);
  }, []);

  const handleSelectAddress = useCallback(
    (address: AddressItem | null) => {
      onSelect(address);
      setSearchAddress('');
      onClose();
    },
    [onClose, onSelect]
  );

  const renderList = () => {
    // Remove duplicates and ensure unique keys
    const uniqueAddresses = new Map<string, AddressItem>();
    dataFiltered.forEach((address) => {
      if (!address) return;
      const addressId = address.id || `${address.name}-${address.phoneNumber || ''}`;
      if (!uniqueAddresses.has(addressId)) {
        uniqueAddresses.set(addressId, address);
      }
    });

    return (
      <Scrollbar sx={{ p: 0.5, maxHeight: 480 }}>
        <Box sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
          {Array.from(uniqueAddresses.values()).map((address) => {
            if (!address) return null;
            const addressId = address.id || `${address.name}-${address.phoneNumber || ''}`;
            return (
              <ButtonBase
                key={addressId}
                onClick={() => handleSelectAddress(address)}
                sx={{
                  py: 1.5,
                  px: 2,
                  gap: 0.5,
                  width: 1,
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  ...(selected(addressId) && { bgcolor: 'action.selected' }),
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ width: '100%', textAlign: 'left' }}
                >
                  {address.name}
                </Typography>

                {address.company && (
                  <Box 
                    sx={{ 
                      color: 'primary.main', 
                      typography: 'caption',
                      width: '100%', 
                      textAlign: 'left',
                      wordBreak: 'break-word',
                    }}
                  >
                    {address.company}
                  </Box>
                )}

                {address.phoneNumber && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      width: '100%', 
                      textAlign: 'left',
                    }}
                  >
                    {address.phoneNumber}
                  </Typography>
                )}

                {address.email && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      width: '100%', 
                      textAlign: 'left',
                      wordBreak: 'break-word',
                    }}
                  >
                    {address.email}
                  </Typography>
                )}

                {address.fullAddress && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      width: '100%', 
                      textAlign: 'left',
                      wordBreak: 'break-word',
                    }}
                  >
                    {address.fullAddress}
                  </Typography>
                )}
              </ButtonBase>
            );
          })}
        </Box>
      </Scrollbar>
    );
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} sx={sx} {...other}>
      <Box
        sx={{
          py: 3,
          pl: 3,
          pr: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6"> {title} </Typography>
        {action && action}
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <TextField
          fullWidth
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
      </Box>

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
  inputData: AddressItem[];
};

function applyFilter({ inputData, query }: ApplyFilterProps) {
  let filtered = inputData.filter((item) => item !== null);

  // Remove duplicates before filtering
  const seenIds = new Set<string>();
  filtered = filtered.filter((item) => {
    if (!item) return false;
    const itemId = item.id || `${item.name}-${item.phoneNumber || ''}`;
    if (seenIds.has(itemId)) {
      return false;
    }
    seenIds.add(itemId);
    return true;
  });

  if (!query) {
    return filtered;
  }

  return filtered.filter((item) => {
    if (!item) return false;
    const { name, company, fullAddress, phoneNumber } = item;
    return [name, company, fullAddress, phoneNumber].some((field) =>
      field?.toLowerCase().includes(query.toLowerCase())
    );
  });
}

