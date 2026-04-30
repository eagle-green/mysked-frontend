import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found/search-not-found';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  list: any[];
  action?: React.ReactNode;
  onSelect: (inspection: any | null) => void;
};

//-------------------------------------------

export function PreTripInspectionTypeDialog({
  list,
  onSelect,
  onClose,
  open,
  title,
  action,
}: Props) {
  const [inspectionSearch, setInspectionSearch] = useState('');

  const dataFiltered = applyFilter({ inputData: list, query: inspectionSearch });

  const notFound = !dataFiltered.length && !!inspectionSearch;

  const handleSearchInspection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInspectionSearch(event.target.value);
  }, []);

  const handleSelectInspection = useCallback(
    (inspection: any | null) => {
      onSelect(inspection);
      setInspectionSearch('');
      // onClose();
    },
    [onClose, onSelect]
  );

  const renderList = () => (
    <Scrollbar sx={{ p: 0.5, maxHeight: 480 }}>
      {dataFiltered.map((inspection, index) => (
        <ButtonBase
          key={`${inspection.id}-${index}`}
          onClick={() => handleSelectInspection(inspection)}
          sx={{
            p: 2,
            my: 0.5,
            gap: 0.5,
            width: 1,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              width: '100%',
            }}
          >
            <Stack spacing={0.5} alignItems="flex-start">
              <Typography variant="body1">{inspection.label}</Typography>
              <Typography variant="caption" color="text.disabled">
                {inspection.description}
              </Typography>
            </Stack>

            <Stack alignSelf="start">
              <Label variant="soft" color={inspection.is_required ? 'success' : 'info'}>
                {inspection.is_required ? 'Required' : 'Optional'}
              </Label>
            </Stack>
          </Box>
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
          value={inspectionSearch}
          onChange={handleSearchInspection}
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
        <SearchNotFound query={inspectionSearch} sx={{ px: 3, pt: 5, pb: 10 }} />
      ) : (
        renderList()
      )}
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  query: string;
  inputData: any[];
};

function applyFilter({ inputData, query }: ApplyFilterProps) {
  if (!query) {
    return inputData;
  }

  return inputData.filter(({ label, field_name }) =>
    [label, field_name].some((field) => field?.toLowerCase().includes(query.toLowerCase()))
  );
}
