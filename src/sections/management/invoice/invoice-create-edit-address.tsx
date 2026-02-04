import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { AddressListDialog } from './address-list-dialog';

import type { InvoiceCreateSchemaType } from './invoice-create-edit-form';

// ----------------------------------------------------------------------

const EAGLE_GREEN_FROM = {
  id: 'eaglegreen',
  name: 'Eagle Green',
  company: 'Traffic Management',
  fullAddress: '#200-100 Park Royal, West Vancouver BC V7T 1A2',
  phoneNumber: 'accounting@eaglegreen.ca',
  email: 'accounting@eaglegreen.ca',
  gstHstNumber: '784223463',
  businessNumber: '78422 3463 RT0001',
  website: 'www.eaglegreen.ca',
};

// ----------------------------------------------------------------------

type Props = {
  isEdit?: boolean;
};

export function InvoiceCreateEditAddress({ isEdit = false }: Props) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<InvoiceCreateSchemaType>();

  const mdUp = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

  // Only watch the specific field needed
  const invoiceFrom = watch('invoiceFrom');

  const addressTo = useBoolean();

  // Set default Eagle Green address on mount
  useEffect(() => {
    if (!invoiceFrom) {
      setValue('invoiceFrom', EAGLE_GREEN_FROM);
    }
  }, [setValue, invoiceFrom]);

  // Fetch customers for address dialog
  const { data: customersResponse } = useQuery({
    queryKey: ['invoice-customers-for-address'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
        orderBy: 'name',
        order: 'asc',
      });
      const response = await fetcher(`${endpoints.invoice.customers}?${params.toString()}`);
      return response;
    },
  });

  const customers = (customersResponse?.data || []) as Array<{
    id: string;
    name: string;
    company_name?: string;
    phone?: string;
    email?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  }>;

  // Transform customers to address format, remove duplicates, and sort
  const seenIds = new Set<string>();
  const addressList = customers
    .filter((customer) => {
      // Remove duplicates by ID
      if (!customer.id || seenIds.has(customer.id)) {
        return false;
      }
      seenIds.add(customer.id);
      return true;
    })
    .map((customer) => {
      // Build full address string from address components
      const addressParts: string[] = [];
      if (customer.address_line1) addressParts.push(customer.address_line1);
      if (customer.address_line2) addressParts.push(customer.address_line2);
      if (customer.city) addressParts.push(customer.city);
      if (customer.state) addressParts.push(customer.state);
      if (customer.postal_code) addressParts.push(customer.postal_code);
      if (customer.country) addressParts.push(customer.country);
      const fullAddress =
        addressParts.length > 0 ? addressParts.join(', ') : customer.company_name || '';

      return {
        id: customer.id,
        name: customer.name,
        company: customer.company_name,
        phoneNumber: customer.phone,
        email: customer.email,
        fullAddress,
      };
    })
    .sort((a, b) => 
      // Sort alphabetically by name (A-Z)
       a.name.localeCompare(b.name)
    );

  const invoiceTo = watch('invoiceTo');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _invoiceFrom = invoiceFrom;

  return (
    <>
      <Stack
        divider={
          <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
        sx={{ p: 3, gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
      >
        <Stack sx={{ width: 1 }}>
          <Typography variant="h6" sx={{ color: 'text.disabled', mb: 2 }}>
            From:
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src="/logo/eaglegreen-single.png"
                alt="Eagle Green"
                sx={{ width: 56, height: 56 }}
              />
              <Box>
                <Typography variant="subtitle2">{EAGLE_GREEN_FROM.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {EAGLE_GREEN_FROM.company}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={0.5}>
              <Typography variant="body2">{EAGLE_GREEN_FROM.fullAddress}</Typography>
              <Typography variant="body2">{EAGLE_GREEN_FROM.email}</Typography>
              <Typography variant="body2">
                GST/HST Registration No.: {EAGLE_GREEN_FROM.gstHstNumber}
              </Typography>
              <Typography variant="body2">
                Business Number: {EAGLE_GREEN_FROM.businessNumber}
              </Typography>
              <Typography variant="body2">{EAGLE_GREEN_FROM.website}</Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              To:
            </Typography>

            <IconButton onClick={addressTo.onTrue}>
              <Iconify icon={invoiceTo ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Box>

          {invoiceTo ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{invoiceTo.name}</Typography>
              {invoiceTo.fullAddress && (
                <Typography variant="body2">{invoiceTo.fullAddress}</Typography>
              )}
              {invoiceTo.phoneNumber && (
                <Typography variant="body2">{invoiceTo.phoneNumber}</Typography>
              )}
              {invoiceTo.email && (
                <Typography variant="body2">{invoiceTo.email}</Typography>
              )}
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.invoiceTo?.message}
            </Typography>
          )}
        </Stack>
      </Stack>

      <AddressListDialog
        title="Customers"
        open={addressTo.value}
        onClose={addressTo.onFalse}
        selected={(selectedId: string) => invoiceTo?.id === selectedId}
        onSelect={(address) => setValue('invoiceTo', address)}
        list={addressList}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
          >
            Add
          </Button>
        }
      />
    </>
  );
}

// I just generated invoice, it created invoice on qbo. when I create invoice, I input Purchase Order, Network Number/FSA and Approver but invoice on qbo Purchase Order, Network Number/FSA and Approver are empty,
// not sure if we are sending those value to qbo when we create invoice on qbo, if you see pwh project when we create shipping we also send P.O. Number and it saves as P.O. Number on invoice qbo. can you check them?
