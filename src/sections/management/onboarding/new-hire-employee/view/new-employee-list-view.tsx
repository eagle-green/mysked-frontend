import type { NewHire } from 'src/types/new-hire';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean , useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { getRoleLabel } from 'src/utils/format-role';

import { roleList } from 'src/assets/data';
import axiosInstance, { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label/label';
import { Iconify } from 'src/components/iconify/iconify';
import { useTable } from 'src/components/table/use-table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { TableNoData } from 'src/components/table/table-no-data';
import { emptyRows, rowInPage } from 'src/components/table/utils';
import { TableEmptyRows } from 'src/components/table/table-empty-rows';
import { TableHeadCustom } from 'src/components/table/table-head-custom';
import { TablePaginationCustom } from 'src/components/table/table-pagination-custom';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { NEW_EMPLOYEE_TABLE_HEAD } from 'src/types/new-hire';

import { NewEmployeeTableRow } from '../new-employee-table-row';
import { NewEmployeeTableToolbar } from '../new-employee-table-toolbar';
import { HiringPackageInviteDialog } from '../hiring-package-invite-dialog';
import { NewEmployeeTableToolbarResult } from '../new-employee-table-toolbar-result';

//--------------------------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  /** Candidate submitted; awaiting admin finalization (legacy URLs used `completed` for this tab). */
  { value: 'in_review', label: 'In review' },
  /** Admin submitted — worker account linked / package finalized. */
  { value: 'done', label: 'Completed' },
];

type HiringPackageApiRow = {
  id: string;
  /** Sequential DB id (1, 2, 3…), like invoices. Present after migration `add_display_id_to_hiring_packages`. */
  display_id?: number | null;
  status: string;
  hire_type: string | null;
  invited_email: string | null;
  invite_expires_at: string | null;
  candidate_email_verified_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  employee_user_id: string | null;
  form_data: Record<string, unknown> | null;
};

export type OnboardingListRow = {
  id: string;
  displayId: number;
  status: string;
  submitted_at: string | null;
  employee_user_id: string | null;
  invited_email: string | null;
  hire_type: string | null;
  created_at: string;
  employee: { first_name: string; last_name: string };
  contract_detail: { position: string; start_date: string; hire_date: string };
  /** Invite email, or work email from form when present. */
  candidateEmail: string;
  /** Raw role slug for toolbar filter (`lct`, `tcp`, …). */
  positionValue: string;
  /** Work email from form (search). */
  employeeEmail: string;
  /** Display label for `contract_detail.position` (role). */
  position: string;
  hireDate: string;
};

function mapPackageToRow(p: HiringPackageApiRow): OnboardingListRow {
  const fd = (p.form_data || {}) as Partial<NewHire>;
  const em = fd.employee;
  const cd = fd.contract_detail;
  const first = em?.first_name?.trim() ?? '';
  const last = em?.last_name?.trim() ?? '';
  const posRaw = (cd?.position ?? '').trim();
  const start = cd?.start_date ?? '';
  /** Admin list column: when the hiring package was created (not employment hire date from the form). */
  const packageCreatedAt = p.created_at ?? '';
  const posDisplay = posRaw ? getRoleLabel(posRaw) : '—';
  const employeeEmail = (em?.email_address ?? '').trim();
  const invited = (p.invited_email ?? '').trim();
  const candidateEmail = invited || employeeEmail || '—';
  const positionValue = posRaw || (p.hire_type ?? '').trim();

  const displayId = p.display_id != null ? Number(p.display_id) : Number.NaN;

  return {
    id: p.id,
    displayId: Number.isFinite(displayId) ? displayId : 0,
    status: p.status,
    submitted_at: p.submitted_at,
    employee_user_id: p.employee_user_id ?? null,
    invited_email: p.invited_email,
    hire_type: p.hire_type,
    created_at: p.created_at,
    employee: { first_name: first, last_name: last },
    contract_detail: {
      position: posDisplay,
      start_date: start,
      hire_date: packageCreatedAt,
    },
    candidateEmail,
    positionValue,
    employeeEmail,
    position: posDisplay,
    hireDate: packageCreatedAt
      ? dayjs(packageCreatedAt).format('YYYY-MM-DD')
      : '',
  };
}

function hiringPackagesListErrorMessage(err: unknown): string {
  const e = err as { _httpStatus?: number; error?: string };
  const status = e?._httpStatus;
  if (status === 401) {
    return 'Your session expired or you are not signed in. Please sign in again.';
  }
  if (status === 403) {
    return 'Only administrators can view hiring packages.';
  }
  if (status === 500) {
    return 'Server error loading the list. If this continues, confirm the database migration for hiring packages has been applied.';
  }
  if (typeof e?.error === 'string') {
    return e.error;
  }
  return 'The list could not be loaded. Please try again.';
}

export function NewEmployeeListView() {
  const { user, loading: authLoading } = useAuthContext();
  const inviteDialog = useBoolean();
  const confirmDelete = useBoolean();
  const deleteIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const skipFilterResetOnMount = useRef(true);

  const canCreateInvite = user?.role === 'admin';

  const router = useRouter();
  const searchParams = useSearchParams();
  const table = useTable({
    defaultDense: searchParams.get('dense') ? searchParams.get('dense') === 'true' : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState({
    query: searchParams.get('search') || '',
    position: searchParams.get('position') ? searchParams.get('position')!.split(',') : [],
    /** Legacy list used `status=completed` for the "In review" (candidate-submitted) tab. */
    status: (() => {
      const s = searchParams.get('status') || 'all';
      return s === 'completed' ? 'in_review' : s;
    })(),
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      params.set('page', String(table.page + 1));
      params.set('rowsPerPage', String(table.rowsPerPage));
      params.set('orderBy', table.orderBy);
      params.set('order', table.order);
      params.set('dense', table.dense ? 'true' : 'false');

      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.position.length > 0) {
        params.set('position', currentFilters.position.join(','));
      }
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.startDate) {
        params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
      }
      if (currentFilters.endDate) {
        params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
      }

      const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newURL);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    router,
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    table.dense,
    currentFilters.query,
    currentFilters.position,
    currentFilters.status,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  useEffect(() => {
    if (skipFilterResetOnMount.current) {
      skipFilterResetOnMount.current = false;
      return;
    }
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.query,
    currentFilters.position,
    currentFilters.status,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  const handleRequestDelete = useCallback(
    (id: string) => {
      deleteIdRef.current = id;
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleConfirmDelete = useCallback(async () => {
    const id = deleteIdRef.current;
    if (!id) return;
    try {
      await axiosInstance.delete(endpoints.hiringPackages.delete(id));
      toast.success('Hiring package deleted');
      await queryClient.invalidateQueries({ queryKey: ['hiring-packages', 'list'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = e?.response?.data?.error || e?.message || 'Delete failed';
      toast.error(typeof msg === 'string' ? msg : 'Delete failed');
    } finally {
      deleteIdRef.current = null;
      confirmDelete.onFalse();
    }
  }, [confirmDelete, queryClient]);

  const handleResendInvite = useCallback(
    async (id: string) => {
      try {
        const res = await axiosInstance.post(endpoints.hiringPackages.resendInvite(id));
        const d = res.data?.data as {
          invite_email_sent?: boolean;
          invited_email?: string;
        };
        if (d?.invite_email_sent) {
          toast.success(
            `New invite emailed to ${d.invited_email ?? 'candidate'}. Older links no longer work.`
          );
        } else {
          toast.warning(
            'Invite link was refreshed, but email was not sent. Check SendGrid or share the link from Create invite.'
          );
        }
        try {
          sessionStorage.removeItem('mysked:hiringInvite:lastCreate');
        } catch {
          /* ignore */
        }
        await queryClient.invalidateQueries({ queryKey: ['hiring-packages', 'list'] });
      } catch (err: unknown) {
        const e = err as { error?: string };
        toast.error(typeof e?.error === 'string' ? e.error : 'Could not resend invite');
      }
    },
    [queryClient]
  );

  const {
    data: packages = [],
    isLoading: isCurrentlyLoading,
    isError: listError,
    error: listQueryError,
    refetch,
  } = useQuery({
    queryKey: ['hiring-packages', 'list'],
    queryFn: async () => {
      const res = await axiosInstance.get(endpoints.hiringPackages.list);
      return (res.data as { data?: HiringPackageApiRow[] })?.data ?? [];
    },
    enabled: !authLoading && user?.role === 'admin',
    retry: false,
  });

  const rows = useMemo(() => packages.map(mapPackageToRow), [packages]);

  const statusCounts = useMemo(() => {
    const finalized = (r: OnboardingListRow) =>
      r.status === 'completed' || !!r.employee_user_id;
    return {
      all: rows.length,
      pending: rows.filter((r) => !r.submitted_at).length,
      in_review: rows.filter((r) => r.submitted_at && !finalized(r)).length,
      done: rows.filter((r) => finalized(r)).length,
    };
  }, [rows]);

  const tabFiltered = useMemo(() => {
    if (currentFilters.status === 'all') return rows;
    if (currentFilters.status === 'pending') return rows.filter((r) => !r.submitted_at);
    const finalized = (r: OnboardingListRow) =>
      r.status === 'completed' || !!r.employee_user_id;
    if (currentFilters.status === 'in_review') {
      return rows.filter((r) => r.submitted_at && !finalized(r));
    }
    if (currentFilters.status === 'done') {
      return rows.filter((r) => finalized(r));
    }
    return rows;
  }, [rows, currentFilters.status]);

  const dataFiltered = useMemo(() => {
    let list = tabFiltered;

    const q = currentFilters.query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const emailInv = (r.invited_email || '').toLowerCase();
        const emailForm = (r.employeeEmail || '').toLowerCase();
        const pos = r.position.toLowerCase();
        const posVal = (r.positionValue || '').toLowerCase();
        const idMatch = r.id.toLowerCase().includes(q);
        const displayIdMatch =
          r.displayId > 0 && String(r.displayId).toLowerCase().includes(q.replace(/\s/g, ''));
        return (
          emailInv.includes(q) ||
          emailForm.includes(q) ||
          pos.includes(q) ||
          posVal.includes(q) ||
          idMatch ||
          displayIdMatch
        );
      });
    }

    if (currentFilters.position.length > 0) {
      list = list.filter(
        (r) => !!(r.positionValue && currentFilters.position.includes(r.positionValue))
      );
    }

    const hireDay = (r: OnboardingListRow) => {
      const raw = r.contract_detail?.hire_date || r.hireDate;
      if (!raw) return null;
      const d = dayjs(raw);
      return d.isValid() ? d.startOf('day') : null;
    };

    const { startDate, endDate } = currentFilters;
    if (startDate && endDate && !dateError) {
      const start = dayjs(startDate).startOf('day');
      const end = dayjs(endDate).startOf('day');
      list = list.filter((r) => {
        const h = hireDay(r);
        if (!h) return false;
        return !h.isBefore(start, 'day') && !h.isAfter(end, 'day');
      });
    } else if (startDate) {
      const start = dayjs(startDate).startOf('day');
      list = list.filter((r) => {
        const h = hireDay(r);
        if (!h) return false;
        return h.isAfter(start.subtract(1, 'second')) || h.isSame(start, 'day');
      });
    } else if (endDate) {
      const end = dayjs(endDate).startOf('day');
      list = list.filter((r) => {
        const h = hireDay(r);
        if (!h) return false;
        return h.isBefore(end.add(1, 'second')) || h.isSame(end, 'day');
      });
    }

    return list;
  }, [tabFiltered, currentFilters, dateError]);

  const sortedFiltered = useMemo(() => {
    const list = [...dataFiltered];
    const { orderBy: ob, order: ord } = table;

    if (ob === 'created_at') {
      list.sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return ord === 'desc' ? tb - ta : ta - tb;
      });
      return list;
    }

    if (ob === 'displayId') {
      list.sort((a, b) => {
        const va = a.displayId ?? 0;
        const vb = b.displayId ?? 0;
        return ord === 'desc' ? vb - va : va - vb;
      });
      return list;
    }

    const sortKey = ob as keyof Pick<
      OnboardingListRow,
      'candidateEmail' | 'position' | 'hireDate' | 'status'
    >;
    const keys: (keyof OnboardingListRow)[] = ['candidateEmail', 'position', 'hireDate', 'status'];
    if (!keys.includes(sortKey)) {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return list;
    }

    list.sort((a, b) => {
      const va = String(a[sortKey] ?? '');
      const vb = String(b[sortKey] ?? '');
      const cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
      return ord === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [dataFiltered, table]);

  const dataPage = useMemo(
    () => rowInPage(sortedFiltered, table.page, table.rowsPerPage),
    [sortedFiltered, table.page, table.rowsPerPage]
  );

  const totalCount = sortedFiltered.length;

  const canReset = !!(
    currentFilters.query ||
    currentFilters.position.length > 0 ||
    currentFilters.status !== 'all' ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  const denseHeight = table.dense ? 52 : 72;

  const notFound = !isCurrentlyLoading && !dataFiltered.length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Hiring packages"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Employee', href: paths.management.user.root },
          { name: 'Hiring packages' },
        ]}
        action={
          canCreateInvite ? (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:letter-unread-bold" />}
              onClick={inviteDialog.onTrue}
            >
              Create invite
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <HiringPackageInviteDialog
        open={inviteDialog.value}
        onClose={inviteDialog.onFalse}
        onCreated={() => refetch()}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete hiring package"
        content="This removes the invite and saved form data for this candidate. Continue?"
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />

      <Card>
        {listError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {hiringPackagesListErrorMessage(listQueryError)}
          </Alert>
        ) : (
          <>
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
                    (tab.value === 'in_review' && 'secondary') ||
                    (tab.value === 'done' && 'success') ||
                    'default'
                  }
                >
                  {tab.value === 'all'
                    ? statusCounts.all
                    : tab.value === 'pending'
                      ? statusCounts.pending
                      : tab.value === 'in_review'
                        ? statusCounts.in_review
                        : statusCounts.done}
                </Label>
              }
            />
          ))}
        </Tabs>

        <NewEmployeeTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ positions: roleList }}
          dateError={!!dateError}
        />

        {canReset && (
          <NewEmployeeTableToolbarResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {/* Same as Employee List: table always visible; Scrollbar + minWidth enable horizontal scroll on narrow viewports */}
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={NEW_EMPLOYEE_TABLE_HEAD}
                rowCount={totalCount}
                onSort={table.onSort}
              />

              <TableBody>
                {isCurrentlyLoading ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {Array.from({ length: 6 }).map((__, i) => (
                        <TableCell key={i}>
                          <Skeleton variant="text" width={i === 4 ? 40 : '80%'} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <>
                    {dataPage.map((row) => (
                      <NewEmployeeTableRow
                        key={row.id}
                        row={row}
                        editHref={paths.management.user.onboarding.edit(row.id)}
                        onDelete={handleRequestDelete}
                        onResendInvite={row.submitted_at ? undefined : handleResendInvite}
                      />
                    ))}
                    <TableEmptyRows
                      height={denseHeight}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, sortedFiltered.length)}
                    />
                    <TableNoData notFound={notFound} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
          </>
        )}
      </Card>
    </DashboardContent>
  );
}
