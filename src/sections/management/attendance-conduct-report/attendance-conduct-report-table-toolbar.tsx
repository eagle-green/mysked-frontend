import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IAttendanceConductReportTableFilters } from 'src/types/attendance-conduct-report';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IAttendanceConductReportTableFilters>;
};

export function AttendanceConductReportTableToolbar({ filters, onResetPage }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query ?? '');

  useEffect(() => {
    setQuery(currentFilters.query ?? '');
  }, [currentFilters.query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== (currentFilters.query ?? '')) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, onResetPage, updateFilters]);

  const { data: usersList } = useQuery({
    queryKey: ['users-all-attendance-conduct-report'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.user}?page=1&rowsPerPage=500&orderBy=first_name&order=asc`
      );
      const data = response?.data ?? response;
      const users = data?.users ?? (Array.isArray(data) ? data : []);
      return Array.isArray(users) ? users : [];
    },
  });

  const employeeOptions = useMemo(() => {
    if (!usersList || !Array.isArray(usersList)) return [];
    return (usersList as any[]).map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || u.id,
    }));
  }, [usersList]);

  return (
    <Box
      sx={{
        p: 2.5,
        gap: 2,
        display: 'flex',
        pr: { xs: 2.5, md: 1 },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-end', md: 'center' },
      }}
    >
      <Autocomplete
        multiple
        options={employeeOptions}
        value={currentFilters.employee ?? []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ employee: newValue });
        }}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField {...params} label="Employee" placeholder="Search employee..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props as any;
          return (
            <Box component="li" key={option.id} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option.name}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          return options.filter((opt) =>
            (opt.name ?? '').toLowerCase().includes(inputValue.toLowerCase())
          );
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Box sx={{ flexGrow: 1, minWidth: { xs: 0, md: 280 } }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          sx={{ width: '100%', minWidth: 0 }}
        />
      </Box>
    </Box>
  );
}
