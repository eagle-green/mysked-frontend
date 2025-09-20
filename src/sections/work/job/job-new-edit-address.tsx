import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { AddressListDialog } from '../../address';

import type { NewJobSchemaType } from './job-create-form';

// ----------------------------------------------------------------------

export function JobNewEditAddress() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<NewJobSchemaType>();

  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const values = watch();

  const addressTo = useBoolean();
  const addressForm = useBoolean();
  const addressSite = useBoolean();

  const { company, client, site } = values as { company: any; client: any; site?: any };

  // Fetch company list from backend
  const { data: companyList = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.companyAll);
      return response.companies.filter((companyItem: any) => companyItem.status === 'active');
    },
  });

  // Fetch client list (clients) from backend
  const { data: clientList = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.clientAll);
      return response.clients.filter((clientItem: any) => clientItem.status === 'active');
    },
  });

  // Fetch sites for the selected company
  const { data: siteList = [] } = useQuery({
    queryKey: ['sites-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.siteAll);
      const allSites = response.sites || [];
      return allSites.filter((siteItem: any) => siteItem.company_id === company.id);
    },
    enabled: !!company?.id, // Only fetch if company is selected
  });

  // Map companyList to add fullAddress and phoneNumber for AddressListDialog
  const mappedCompanyList = companyList.map((companyItem: any) => ({
    ...companyItem,
    type: 'company',
            fullAddress: companyItem.display_address || [
      companyItem.unit_number,
      companyItem.street_number,
      companyItem.street_name,
      companyItem.city,
      companyItem.province,
      companyItem.postal_code,
      companyItem.country,
    ]
      .filter(Boolean)
      .join(', '),
    phoneNumber: companyItem.contact_number,
  }));

  // Map clientList to add fullAddress and phoneNumber for AddressListDialog
  const mappedClientList = clientList.map((clientItem: any) => ({
    ...clientItem,
    type: 'client',
            fullAddress: clientItem.display_address || [
      clientItem.unit_number,
      clientItem.street_number,
      clientItem.street_name,
      clientItem.city,
      clientItem.province,
      clientItem.postal_code,
      clientItem.country,
    ]
      .filter(Boolean)
      .join(', '),
    phoneNumber: clientItem.contact_number,
  }));

  // Map siteList to add fullAddress and phoneNumber for AddressListDialog
  const mappedSiteList = siteList.map((siteItem: any) => ({
    ...siteItem,
    type: 'site',
    fullAddress: siteItem.display_address || [
      siteItem.unit_number,
      siteItem.street_number,
      siteItem.street_name,
      siteItem.city,
      siteItem.province,
      siteItem.postal_code,
      siteItem.country,
    ]
      .filter(Boolean)
      .join(', '),
    phoneNumber: siteItem.contact_number,
  }));

  // Clear site when company changes
  useEffect(() => {
    if (site?.company_id && site.company_id !== company?.id) {
      (setValue as any)('site', {
        id: '',
        company_id: '',
        name: '',
        email: '',
        contact_number: '',
        unit_number: '',
        street_number: '',
        street_name: '',
        city: '',
        province: '',
        postal_code: '',
        country: '',
        status: '',
        fullAddress: '',
        phoneNumber: '',
      });
    }
  }, [company?.id, site?.company_id, setValue]);

  function formatPhoneNumber(phone: string) {
    const digits = phone?.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return phone;
  }

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
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              Company:
            </Typography>

            <IconButton onClick={addressForm.onTrue}>
              <Iconify icon={company && company.id ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Box>

          {company && company.id ? (
            <Stack spacing={1}>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={company.logo_url ?? undefined}
                  alt={company.name}
                  sx={{ width: 28, height: 28 }}
                >
                  {company.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle2">{company?.name}</Typography>
              </Box>
              <Typography variant="body2">
                {company?.fullAddress || ''}
              </Typography>
              <Typography variant="body2">{formatPhoneNumber(company?.phoneNumber)}</Typography>
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.company?.id?.message}
            </Typography>
          )}
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              Site:
            </Typography>

            <IconButton 
              onClick={addressSite.onTrue}
              disabled={!company?.id} // Disable if no company is selected
            >
              <Iconify icon={site && site.id ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Box>

          {site && site.id ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{site?.name}</Typography>
              <Typography variant="body2">
                {site?.fullAddress || ''}
              </Typography>
              <Typography variant="body2">{formatPhoneNumber(site?.phoneNumber)}</Typography>
            </Stack>
          ) : !company?.id ? (
            <Typography typography="caption" sx={{ color: 'text.secondary' }}>
              Select a company first to choose a site
            </Typography>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {(errors as any).site?.id?.message}
            </Typography>
          )}
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              Client:
            </Typography>

            <IconButton onClick={addressTo.onTrue}>
              <Iconify icon={client && client.id ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Box>

          {client && client.id ? (
            <Stack spacing={1}>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={client.logo_url ?? undefined}
                  alt={client.name}
                  sx={{ width: 28, height: 28 }}
                >
                  {client.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle2">{client.name}</Typography>
              </Box>

              <Typography variant="body2">
                {client?.fullAddress || ''}
              </Typography>
              <Typography variant="body2">{formatPhoneNumber(client?.phoneNumber)}</Typography>
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.client?.id?.message}
            </Typography>
          )}
        </Stack>
      </Stack>

      <AddressListDialog
        title="Companies"
        open={addressForm.value}
        onClose={addressForm.onFalse}
        selected={(selectedId: string) => company?.id === selectedId}
        onSelect={(address) => {
          if (!address) {
            setValue('company', {
              id: '',
              region: '',
              name: '',
              logo_url: '',
              email: '',
              contact_number: '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: '',
              phoneNumber: '',
            });
          } else {
            setValue('company', {
              id: address.id || '',
              region: '',
              name: address.name || '',
              logo_url: address.logo_url || '',
              email: '',
              contact_number: address.phoneNumber || '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: address.fullAddress || '',
              phoneNumber: address.phoneNumber || '',
            });
          }
        }}
        list={mappedCompanyList}
        // action={
        //   <Button
        //     size="small"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //     sx={{ alignSelf: 'flex-end' }}
        //   >
        //     New
        //   </Button>
        // }
      />

      <AddressListDialog
        title="Clients"
        open={addressTo.value}
        onClose={addressTo.onFalse}
        selected={(selectedId: string) => client?.id === selectedId}
        onSelect={(address) => {
          if (!address) {
            setValue('client', {
              id: '',
              region: '',
              name: '',
              logo_url: '',
              email: '',
              contact_number: '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: '',
              phoneNumber: '',
            });
          } else {
            setValue('client', {
              id: address.id || '',
              region: '',
              name: address.name || '',
              logo_url: address.logo_url || '',
              email: '',
              contact_number: address.phoneNumber || '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: address.fullAddress || '',
              phoneNumber: address.phoneNumber || '',
            });
          }
        }}
        list={mappedClientList}
        // action={
        //   <Button
        //     size="small"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //     sx={{ alignSelf: 'flex-end' }}
        //   >
        //     New
        //   </Button>
        // }
      />

      <AddressListDialog
        title={company?.name ? `${company.name}'s sites` : 'Sites'}
        open={addressSite.value}
        onClose={addressSite.onFalse}
        selected={(selectedId: string) => site?.id === selectedId}
        onSelect={(address) => {
          if (!address) {
            (setValue as any)('site', {
              id: '',
              company_id: '',
              name: '',
              email: '',
              contact_number: '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: '',
              phoneNumber: '',
            });
          } else {
            (setValue as any)('site', {
              id: address.id || '',
              company_id: company?.id || '',
              name: address.name || '',
              email: '',
              contact_number: address.phoneNumber || '',
              unit_number: '',
              street_number: '',
              street_name: '',
              city: '',
              province: '',
              postal_code: '',
              country: '',
              status: '',
              fullAddress: address.fullAddress || '',
              phoneNumber: address.phoneNumber || '',
            });
          }
        }}
        list={mappedSiteList}
        // action={
        //   <Button
        //     size="small"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //     sx={{ alignSelf: 'flex-end' }}
        //   >
        //     New
        //   </Button>
        // }
      />
    </>
  );
}
