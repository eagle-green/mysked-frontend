import dayjs from 'dayjs';
import { pdf } from '@react-pdf/renderer';
import { useMemo, useState, useCallback } from 'react';
import { useBoolean, usePopover, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useSearchParams } from 'src/routes/hooks/use-search-params';

import InvoicePdf from 'src/pages/template/invoice-pdf';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { InvoiceFilterResult } from './invoice-filter-result';
import { InvoiceFilterToolbar } from './invoice-filter-toolbar';
import { InvoiceQuickEditForm } from './invoice-quick-edit-form';
//----------------------------------------------------------------------
type IInvoiceFilterType = {
  service: string[];
  region: string[];
  client: string[];
  startDate: Date | null;
  endDate: Date | null;
};

export type InvoiceDetailType = {
  invoiceNumber: string;
  customerName: string;
  clientName: string;
  address: string;
  isReviewed: boolean;
  services: Array<{
    service: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export function InvoiceGenerateView() {
  const searchParams = useSearchParams();
  const menuActions = usePopover();
  const invoiceMenuActions = usePopover();
  const quickEditForm = useBoolean();
  const filters = useSetState<IInvoiceFilterType>({
    service: searchParams.get('service') ? searchParams.get('service')!.split(',') : [],
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
  });

  const REGION = [
    { value: 'Metro Vancouver', label: 'Metro Vancouver' },
    { value: 'Vancouver Island', label: 'Vancouver Island' },
  ];

  const SERVICES: { value: string; label: string }[] = [
    { value: 'TCP', label: 'TCP' },
    { value: 'LCT', label: 'LCT' },
    { value: 'HWY', label: 'HWY' },
  ];

  const CLIENT = [{ value: 'Eagle Green', label: 'Eagle Green' }];

  const [invoiceData, setInvoiceData] = useState<InvoiceDetailType[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceDetailType | null>(null);

  const generateInvoice = () => {
    setInvoiceData([
      {
        invoiceNumber: 'INV-000002',
        customerName: 'Kiwoon Jung',
        clientName: 'EG - Test',
        address: 'Test Address 00002',
        isReviewed: true,
        services: [{ service: 'LCT', quantity: 1, unitPrice: 90 }],
      },
      {
        invoiceNumber: 'INV-000001',
        customerName: 'Jerwin Fortillano',
        clientName: 'EG - Test',
        address: 'Test Address 00001',
        isReviewed: false,
        services: [{ service: 'LCT', quantity: 3, unitPrice: 90 }],
      },
      {
        invoiceNumber: 'INV-000003',
        customerName: 'Kessia Pedalino',
        clientName: 'EG - Test',
        address: 'Test Address 00003',
        isReviewed: true,
        services: [
          { service: 'LCT', quantity: 1, unitPrice: 90 },
          { service: 'Mobilization', quantity: 1, unitPrice: 70 },
        ],
      },
    ]);
  };

  const hasPendingInvoice = useMemo(
    () => invoiceData.some((invoice) => !invoice.isReviewed),
    [invoiceData]
  );

  const { state: currentFilters, setState: updateFilters } = filters;
  const defaultValues = {
    service: [],
    region: [],
    client: [],
    startDate: null,
    endDate: null,
  };

  const handleResetFilters = useCallback(() => {
    setInvoiceData([]);
    updateFilters(defaultValues);
  }, [updateFilters]);

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const showFilterResult = JSON.stringify(currentFilters) !== JSON.stringify(defaultValues);

  const markAllAsReviewed = () => {
    setInvoiceData((prevData) =>
      prevData.map((invoice) => ({
        ...invoice,
        isReviewed: true, // Set all invoices to reviewed
      }))
    );
  };

  const toggleInvoiceReviewed = (invoiceNumber: string) => {
    setInvoiceData((prev) =>
      prev.map((invoice: InvoiceDetailType) =>
        invoice.invoiceNumber === invoiceNumber
          ? { ...invoice, isReviewed: !invoice.isReviewed }
          : invoice
      )
    );
  };

  const handleUpdate = (value: InvoiceDetailType) => {
    setInvoiceData((prev) =>
      prev.map((invoice: InvoiceDetailType) =>
        invoice.invoiceNumber === value.invoiceNumber ? { ...value } : invoice
      )
    );
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          {/* <Iconify icon="solar:download-bold" /> */}
          Finalize All
        </MenuItem>

        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          {/* <Iconify icon="solar:export-bold" /> */}
          Export Invoices
        </MenuItem>

        <MenuItem
          disabled={!hasPendingInvoice}
          onClick={() => {
            markAllAsReviewed();
            menuActions.onClose();
          }}
        >
          {/* <Iconify icon="solar:file-check-bold-duotone" /> */}
          Mark All Reviewed
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderInvoiceMenuActions = () => (
    <CustomPopover
      open={invoiceMenuActions.open}
      anchorEl={invoiceMenuActions.anchorEl}
      onClose={invoiceMenuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            quickEditForm.onTrue();
            invoiceMenuActions.onClose();
          }}
        >
          {/* <IcQuick Eonify icon="solar:download-bold" /> */}
          Quick Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            toggleInvoiceReviewed(currentInvoice!.invoiceNumber);
            invoiceMenuActions.onClose();
          }}
        >
          {/* <Iconify icon="solar:export-bold" /> */}
          {!currentInvoice?.isReviewed ? 'Mark as review' : 'Mark as Pending'}
        </MenuItem>

        <MenuItem
          onClick={async () => {
            invoiceMenuActions.onClose();

            try {
              const blob = await pdf(<InvoicePdf />).toBlob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;

              link.download = `invoice-${currentInvoice?.invoiceNumber}`;
              document.body.appendChild(link);
              link.click();

              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }, 300);
            } catch (error) {
              console.error('Error generating PDF:', error);
            }
          }}
        >
          {/* <Iconify icon="solar:file-check-bold-duotone" /> */}
          Export Invoice
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderQuickEditForm = () => (
    <InvoiceQuickEditForm
      currentInvoice={currentInvoice}
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      onUpdateSuccess={(data) => {
        handleUpdate(data);
        quickEditForm.onFalse();
      }}
    />
  );

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            px: 2.5,
          }}
        >
          <Typography variant="h5">INVOICE FILTER</Typography>
          <Button
            type="button"
            variant="contained"
            color="primary"
            size="medium"
            sx={{ minWidth: { xs: '120px', md: '140px' } }}
            disabled={!showFilterResult}
            onClick={() => {
              generateInvoice();
            }}
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            Generate
          </Button>
        </Box>

        <InvoiceFilterToolbar
          filters={filters}
          options={{ services: SERVICES, region: REGION, client: CLIENT }}
          dateError={!!dateError}
        />

        {showFilterResult && (
          <InvoiceFilterResult
            filters={filters}
            onResetFilters={handleResetFilters}
            totalResults={[].length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}
      </Card>
      {!invoiceData.length ? (
        <Card sx={{ mb: 2, p: 2, bgcolor: 'background.neutral' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '670px',
              flexDirection: 'column',
            }}
          >
            <Iconify icon="custom:invoice-duotone" height={65} width={65} />
            <Typography variant="h5">No Invoices Yet</Typography>
            <Typography variant="caption" color="text.disabled">
              You havent generated any invoices. Please generate your invoices
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card sx={{ mb: 2, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">INVOICES</Typography>
            <Box
              sx={{
                gap: 2,
                width: 1,
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <IconButton onClick={menuActions.onOpen} disabled={!invoiceData.length}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Box>
          </Stack>
          <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              w: 1,
            }}
          >
            {invoiceData.map((invoice, index) => (
              <Box
                key={`invoice${index + 1}`}
                sx={{
                  p: 1,
                  width: { xs: 1, sm: 1, md: '33%' },
                }}
              >
                <Card
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="column">
                      <Typography variant="caption" color="text.disabled">
                        INVOICE #
                      </Typography>
                      <Typography variant="h6">{invoice.invoiceNumber}</Typography>
                    </Stack>

                    <IconButton
                      onClick={(event) => {
                        setCurrentInvoice(invoice);
                        invoiceMenuActions.onOpen(event);
                      }}
                    >
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </Stack>
                  <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Stack direction="column">
                      <Typography variant="caption" color="text.disabled">
                        CLIENT NAME
                      </Typography>
                      <Typography variant="body1">{invoice.clientName}</Typography>
                    </Stack>

                    <Stack direction="column">
                      <Typography variant="caption" color="text.disabled">
                        CUSTOMER NAME
                      </Typography>
                      <Typography variant="body1">{invoice.customerName}</Typography>
                    </Stack>

                    <Stack direction="column">
                      <Typography variant="caption" color="text.disabled">
                        ADDRESS
                      </Typography>
                      <Typography variant="body1">{invoice.address}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="flex-end" alignItems="center">
                      <IconButton disabled>
                        {invoice.isReviewed ? (
                          <Iconify
                            icon="solar:verified-check-bold"
                            sx={{ color: 'primary.main' }}
                          />
                        ) : (
                          <Iconify icon="solar:info-circle-bold" sx={{ color: 'warning.main' }} />
                        )}
                      </IconButton>
                      <Typography
                        variant="caption"
                        color={invoice.isReviewed ? 'primary.main' : 'warning.main'}
                      >
                        {invoice.isReviewed ? 'REVIEWED' : 'PENDING'}
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.disabled">
                      TOTAL
                    </Typography>
                    <Typography variant="body1" color="primary.main">
                      {`$ ${invoice.services.reduce((acc, currentService) => acc + currentService.quantity * currentService.unitPrice, 0)}.00`}
                    </Typography>
                  </Stack>
                </Card>
              </Box>
            ))}
          </Box>
        </Card>
      )}
      {renderMenuActions()}
      {renderInvoiceMenuActions()}
      {renderQuickEditForm()}
    </>
  );
}
