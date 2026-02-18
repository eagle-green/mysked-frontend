import dayjs from 'dayjs';
import { useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components/router-link';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { useTable } from 'src/components/table/use-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { HiringPackageToolbar } from '../hiring-package-toolbar';

//----------------------------------------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const HIRING_PACKAGE_TYPE: { value: string; label: string }[] = [
  { value: 'contractual', label: 'Contractual' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'seasonal', label: 'Seasonal' },
];

export function HiringPackageListView() {
  const searchParams = useSearchParams();

  // Initialize table state from URL parameters
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState({
    query: searchParams.get('search') || '',
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      table.onResetPage();
    },
    [filters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Hiring Package"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Hiring Package List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.management.hiringPackage.create}
            variant="contained"
            // startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Create Hiring Package
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'pending' && 'warning') ||
                    (tab.value === 'approved' && 'success') ||
                    (tab.value === 'rejected' && 'error') ||
                    'default'
                  }
                >
                  {0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <HiringPackageToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ types: HIRING_PACKAGE_TYPE }}
          dateError={!!dateError}
        />
      </Card>
    </DashboardContent>
  );
}
