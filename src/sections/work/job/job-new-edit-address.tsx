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
import { provinceList } from 'src/assets/data/assets';

import { Iconify } from 'src/components/iconify';

import { AddressListDialog } from '../../address';

import type { NewJobSchemaType } from './job-new-edit-form';

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

  const { site, client } = values as { site: any; client: any };

  // Fetch site list from backend
  const { data: siteList = [] } = useQuery({
    queryKey: ['sites', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.site}?status=active`);
      return response.data.sites;
    },
  });

  // Fetch client list (clients) from backend
  const { data: clientList = [] } = useQuery({
    queryKey: ['clients', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.client}?status=active`);
      return response.data.clients;
    },
  });

  // Map siteList to add fullAddress and phoneNumber for AddressListDialog
  const mappedSiteList = siteList.map((siteItem: any) => ({
    ...siteItem,
    type: 'site',
    fullAddress: [
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
    phoneNumber: siteItem.phone_number,
  }));

  // Map clientList to add fullAddress and phoneNumber for AddressListDialog
  const mappedClientList = clientList.map((clientItem: any) => ({
    ...clientItem,
    type: 'client',
    fullAddress: [
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
    phoneNumber: clientItem.phone_number,
  }));

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
              Site:
            </Typography>

            <IconButton onClick={addressForm.onTrue}>
              <Iconify icon={site && site.id ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Box>

          {site && site.id ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{site?.name}</Typography>
              <Typography variant="body2">
                {(() => {
                  if (!site?.fullAddress) return '';
                  let addr = site.fullAddress;
                  provinceList.forEach(({ value, code }) => {
                    addr = addr.replace(value, code);
                  });
                  return addr;
                })()}
              </Typography>
              <Typography variant="body2">{formatPhoneNumber(site?.phoneNumber)}</Typography>
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.site?.id?.message}
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
                {(() => {
                  if (!client?.fullAddress) return '';
                  let addr = client.fullAddress;
                  provinceList.forEach(({ value, code }) => {
                    addr = addr.replace(value, code);
                  });
                  return addr;
                })()}
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
        title="Sites"
        open={addressForm.value}
        onClose={addressForm.onFalse}
        selected={(selectedId: string) => site?.id === selectedId}
        onSelect={(address) => {
          if (!address) {
            setValue('site', {
              id: '',
              region: '',
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
            setValue('site', {
              id: address.id || '',
              region: '',
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
    </>
  );
}
