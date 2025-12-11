import { z } from 'zod';
import { useBoolean } from 'minimal-shared/hooks';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { endpoints, fetcher } from 'src/lib/axios';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { AddressListDialog } from 'src/sections/address/address-list-dialog';

import { useAuthContext } from 'src/auth/hooks';

import { ClientQuickEditForm } from '../client/client-quick-edit-form';
import { SiteQuickEditForm } from '../company/site/site-quick-edit-form';
import { CompanyQuickEditForm } from '../company/company-quick-edit-form';

//----------------------------------------------------------------------------------------------------------------

const MEMO_STATUS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
];

const MEMO_VISIBILITY = [
  { label: 'All Employees', value: 'all' },
  { label: 'Assignees Only', value: 'assignee' },
  { label: 'Department Only', value: 'department' },
];

const CreateCompanyWideMemoSchema = z.object({
  memo_title: z.string().min(1, 'title is required'),
  memo_content: z.string().min(1, 'Memon content is required'),
});

export function CreateCompanyWideMemoForm() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const theme = useTheme();
  const router = useRouter();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const [assignee, setAssignee] = useState<{ label: string; value: string }[]>([
    { label: 'Jerwin Fortillano', value: 'Jerwin Fortillano' },
    { label: 'Kesia', value: 'Kesia' },
    { label: 'Jenny', value: 'Jenny' },
  ]);
  const [visibility, setVisibility] = useState<boolean>(false);
  const methods = useForm<{
    company: {
      id: string;
      region: string;
      name: string;
      logo_url: string | null;
      email: string;
      contact_number: string;
      unit_number: string;
      street_number: string;
      street_name: string;
      city: string;
      province: string;
      postal_code: string;
      country: string;
      status: string;
      fullAddress: string;
      phoneNumber: string;
    };
    client: {
      id: string;
      region: string;
      name: string;
      logo_url: string;
      email: string;
      contact_number: string;
      unit_number: string;
      street_number: string;
      street_name: string;
      city: string;
      province: string;
      postal_code: string;
      country: string;
      status: string;
      fullAddress: string;
      phoneNumber: string;
    };
    site: {
      id: string;
      company_id: string;
      name: string;
      email: string;
      contact_number: string;
      unit_number: string;
      street_number: string;
      street_name: string;
      city: string;
      province: string;
      postal_code: string;
      country: string;
      status: string;
      fullAddress: string;
      phoneNumber: string;
    };
    pendingMemos: { pendingMemo: string; status: string }[];
  }>({
    mode: 'all',
    defaultValues: {
      pendingMemos: [{ pendingMemo: '', status: 'pending' }],
    },
  });

  const addressTo = useBoolean();
  const addressForm = useBoolean();
  const addressSite = useBoolean();
  const companyCreate = useBoolean();
  const clientCreate = useBoolean();
  const siteCreate = useBoolean();

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    watch,
  } = methods;

  const values = watch();
  const { company, client, site } = values as { company: any; client: any; site?: any };

  // Fetch company list from backend
  const { data: companyList = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.companyAll);
      return response.companies || [];
    },
  });

  // Fetch client list (clients) from backend
  const { data: clientList = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.clientAll);
      return response.clients || [];
    },
  });

  // Fetch sites for the selected company
  const { data: siteList = [] } = useQuery({
    queryKey: ['sites-all', company?.id],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.site}/job-creation`);
      const allSites = response.sites || [];
      const filteredSites = allSites.filter((siteItem: any) => siteItem.company_id === company.id);
      return filteredSites;
    },
    enabled: !!company?.id, // Only fetch if company is selected
  });

  const onSubmit = handleSubmit(async (formdata) => {
    console.log(formdata);
  });

  const handleRemove = useCallback(
    (assign: string) => {
      const users = assignee.filter((t: { label: string; value: string }) => t.value !== assign);
      setAssignee(users);
    },
    [assignee]
  );

  const {
    fields: pedingItemFields,
    append: appendPendingItemControlFields,
    remove: removePendingItemControlFields,
  } = useFieldArray({
    control: methods.control,
    name: 'pendingMemos',
  });

  const pendingItemControlFields = (index: number): Record<string, string> => ({
    pendingMemo: `pendingMemos[${index}].pendingMemo`,
    status: `pendingMemos[${index}].status`,
  });

  const defaultPendingItemValues: Omit<{ pendingMemo: string; status: string }, 'id'> = {
    pendingMemo: '',
    status: 'pending',
  };

  function formatPhoneGlobal(phone: string) {
    const digits = phone?.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return phone;
  }

  // Map companyList to add fullAddress and phoneNumber for AddressListDialog
  const mappedCompanyList = (Array.isArray(companyList) ? companyList : []).map(
    (companyItem: any) => {
      // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
      const streetAddress = [
        companyItem.unit_number,
        companyItem.street_number,
        companyItem.street_name,
      ]
        .filter(Boolean)
        .join(' ');

      // Convert province name to code
      const getProvinceCode = (province: string) => {
        const provinceMap: { [key: string]: string } = {
          'British Columbia': 'BC',
          Alberta: 'AB',
          Saskatchewan: 'SK',
          Manitoba: 'MB',
          Ontario: 'ON',
          Quebec: 'QC',
          'New Brunswick': 'NB',
          'Nova Scotia': 'NS',
          'Prince Edward Island': 'PE',
          'Newfoundland and Labrador': 'NL',
          'Northwest Territories': 'NT',
          Nunavut: 'NU',
          Yukon: 'YT',
        };
        return provinceMap[province] || province;
      };

      const cityAddress = [
        companyItem.city,
        getProvinceCode(companyItem.province),
        companyItem.postal_code,
      ]
        .filter(Boolean)
        .join(' ');

      const fullAddress = [streetAddress, cityAddress].filter(Boolean).join('\n');

      // Format phone number: convert +17783493433 to (778) 349-3433
      const formatPhone = (phone: string) => {
        if (!phone) return '';
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        // If it starts with 1 and has 11 digits, remove the 1
        if (digits.length === 11 && digits.startsWith('1')) {
          const withoutCountryCode = digits.substring(1);
          return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
        }
        // If it has 10 digits, format as (XXX) XXX-XXXX
        if (digits.length === 10) {
          return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        }
        // Return original if can't format
        return phone;
      };

      const formattedPhone = formatPhone(companyItem.contact_number);

      // Format contact info: email | phone (if both exist)
      let contactInfo = '';
      if (companyItem.email && formattedPhone) {
        contactInfo = `${companyItem.email} | ${formattedPhone}`;
      } else if (companyItem.email) {
        contactInfo = companyItem.email;
      } else if (formattedPhone) {
        contactInfo = formattedPhone;
      }

      return {
        ...companyItem,
        type: 'company',
        fullAddress,
        phoneNumber: formattedPhone,
        contactInfo, // Add formatted contact info
      };
    }
  );

  // Map clientList to add fullAddress and phoneNumber for AddressListDialog
  const mappedClientList = clientList.map((clientItem: any) => {
    // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
    const streetAddress = [clientItem.unit_number, clientItem.street_number, clientItem.street_name]
      .filter(Boolean)
      .join(' ');

    // Convert province name to code
    const getProvinceCode = (province: string) => {
      const provinceMap: { [key: string]: string } = {
        'British Columbia': 'BC',
        Alberta: 'AB',
        Saskatchewan: 'SK',
        Manitoba: 'MB',
        Ontario: 'ON',
        Quebec: 'QC',
        'New Brunswick': 'NB',
        'Nova Scotia': 'NS',
        'Prince Edward Island': 'PE',
        'Newfoundland and Labrador': 'NL',
        'Northwest Territories': 'NT',
        Nunavut: 'NU',
        Yukon: 'YT',
      };
      return provinceMap[province] || province;
    };

    const cityAddress = [
      clientItem.city,
      getProvinceCode(clientItem.province),
      clientItem.postal_code,
    ]
      .filter(Boolean)
      .join(' ');

    const fullAddress = [streetAddress, cityAddress].filter(Boolean).join('\n');

    // Format phone number: convert +17783493433 to (778) 349-3433
    const formatPhoneNumber = (phone: string) => {
      if (!phone) return '';
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');
      // If it starts with 1 and has 11 digits, remove the 1
      if (digits.length === 11 && digits.startsWith('1')) {
        const withoutCountryCode = digits.substring(1);
        return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
      }
      // If it has 10 digits, format as (XXX) XXX-XXXX
      if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      }
      // Return original if can't format
      return phone;
    };

    const formattedPhone = formatPhoneNumber(clientItem.contact_number);

    // Format contact info: email | phone (if both exist)
    let contactInfo = '';
    if (clientItem.email && formattedPhone) {
      contactInfo = `${clientItem.email} | ${formattedPhone}`;
    } else if (clientItem.email) {
      contactInfo = clientItem.email;
    } else if (formattedPhone) {
      contactInfo = formattedPhone;
    }

    return {
      ...clientItem,
      type: 'client',
      fullAddress,
      phoneNumber: formattedPhone,
      contactInfo, // Add formatted contact info
    };
  });

  // Map siteList to add fullAddress and phoneNumber for AddressListDialog
  const mappedSiteList = siteList.map((siteItem: any) => {
    // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
    const streetAddress = [siteItem.unit_number, siteItem.street_number, siteItem.street_name]
      .filter(Boolean)
      .join(' ');

    // Convert province name to code
    const getProvinceCode = (province: string) => {
      const provinceMap: { [key: string]: string } = {
        'British Columbia': 'BC',
        Alberta: 'AB',
        Saskatchewan: 'SK',
        Manitoba: 'MB',
        Ontario: 'ON',
        Quebec: 'QC',
        'New Brunswick': 'NB',
        'Nova Scotia': 'NS',
        'Prince Edward Island': 'PE',
        'Newfoundland and Labrador': 'NL',
        'Northwest Territories': 'NT',
        Nunavut: 'NU',
        Yukon: 'YT',
      };
      return provinceMap[province] || province;
    };

    const cityAddress = [siteItem.city, getProvinceCode(siteItem.province), siteItem.postal_code]
      .filter(Boolean)
      .join(' ');

    const fullAddress = [streetAddress, cityAddress].filter(Boolean).join('\n');

    // Format phone number: convert +17783493433 to (778) 349-3433
    const formatPhoneNumber = (phone: string) => {
      if (!phone) return '';
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');
      // If it starts with 1 and has 11 digits, remove the 1
      if (digits.length === 11 && digits.startsWith('1')) {
        const withoutCountryCode = digits.substring(1);
        return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
      }
      // If it has 10 digits, format as (XXX) XXX-XXXX
      if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      }
      // Return original if can't format
      return phone;
    };

    const formattedPhone = formatPhoneNumber(siteItem.contact_number);

    // Format contact info: email | phone (if both exist)
    let contactInfo = '';
    if (siteItem.email && formattedPhone) {
      contactInfo = `${siteItem.email} | ${formattedPhone}`;
    } else if (siteItem.email) {
      contactInfo = siteItem.email;
    } else if (formattedPhone) {
      contactInfo = formattedPhone;
    }

    return {
      ...siteItem,
      type: 'site',
      fullAddress,
      phoneNumber: formattedPhone,
      contactInfo, // Add formatted contact info
    };
  });

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

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
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
                Customer:
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
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}
                >
                  {company?.fullAddress || ''}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {company?.contactInfo || formatPhoneGlobal(company?.phoneNumber) || ''}
                </Typography>
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
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}
                >
                  {site?.fullAddress || ''}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {site?.contactInfo || formatPhoneGlobal(site?.phoneNumber) || ''}
                </Typography>
              </Stack>
            ) : !company?.id ? (
              <Typography typography="caption" sx={{ color: 'text.secondary' }}>
                Select a customer first to choose a site
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

                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}
                >
                  {client?.fullAddress || ''}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {client?.contactInfo || formatPhoneGlobal(client?.phoneNumber) || ''}
                </Typography>
              </Stack>
            ) : (
              <Typography typography="caption" sx={{ color: 'error.main' }}>
                {errors.client?.id?.message}
              </Typography>
            )}
          </Stack>
        </Stack>
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Typography variant="h6">Publish Wide Memo</Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={visibility}
                      onChange={(e) => setVisibility(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {visibility ? 'All Employees' : 'Department Only'}
                      </Typography>
                      <Tooltip
                        title={
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Toggle visibility to control access:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'primary.main',
                                  }}
                                />
                                <Typography variant="subtitle2">Enabled</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'gray',
                                  }}
                                />
                                <Typography variant="subtitle2">Disabled</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic' }}>
                                Note: Mandatory restrictions
                              </Typography>
                            </Box>
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Icon
                          icon="solar:info-circle-line-duotone"
                          width={16}
                          height={16}
                          style={{ color: 'var(--palette-text-secondary)', cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Field.Text
                fullWidth
                placeholder="Write your meme title here ..."
                name="memoTitle"
                label="Title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />

              <Field.Text
                fullWidth
                multiline
                rows={4}
                placeholder="Write your memo content here ..."
                name="memoDescription"
                label="Description"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:case-minimalistic-bold" sx={{ color: 'primary' }} />
                  <Typography variant="h6">Pending Items</Typography>
                </Stack>

                <Stack>
                  <Button
                    size="medium"
                    color="primary"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    sx={{ flexShrink: 0, alignItems: 'flex-start' }}
                    onClick={() => {
                      appendPendingItemControlFields({
                        ...defaultPendingItemValues,
                      });
                    }}
                  >
                    Add Memo
                  </Button>
                </Stack>
              </Box>

              <Box>
                {pedingItemFields.map((fields, index) => (
                  <Box
                    key={`pendingMemos-${fields.id}-${index}`}
                    sx={{
                      gap: 1.5,
                      display: 'flex',
                      alignItems: 'flex-end',
                      flexDirection: 'column',
                      mt: 2,
                      w: 1,
                    }}
                  >
                    <Box
                      sx={{
                        gap: 2,
                        width: 1,
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                      }}
                    >
                      <Box sx={{ flex: 3 }}>
                        <Field.Text
                          size="small"
                          name={pendingItemControlFields(index).pendingMemo}
                          label="Pending Memo*"
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Field.Select
                          size="small"
                          name={pendingItemControlFields(index).status}
                          label="Status"
                          disabled
                        >
                          {MEMO_STATUS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Field.Select>
                      </Box>

                      {!isXsSmMd && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            removePendingItemControlFields(index);
                          }}
                          sx={{
                            px: 1,
                            minWidth: 'auto',
                            width: '40px',
                            height: '40px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            alignSelf: 'flex-start',
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </Box>
                    {isXsSmMd && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                          removePendingItemControlFields(index);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.disabled">
                  List of items awaiting action for this memo
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
        <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push(paths.management.memo.list)}>
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => {}}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              color="success"
            >
              Publish Memo
            </Button>
          </Box>
        </Box>
      </Form>

      <AddressListDialog
        title="Customers"
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
            const companyData = address as any;

            // Use the pre-formatted address from mappedCompanyList
            const fullAddress = companyData.fullAddress || companyData.display_address || '';

            const selectedCompany = {
              id: companyData.id || '',
              region: companyData.region || '',
              name: companyData.name || '',
              logo_url: companyData.logo_url || '',
              email: companyData.email || '',
              contact_number: companyData.contact_number || companyData.phoneNumber || '',
              unit_number: companyData.unit_number || '',
              street_number: companyData.street_number || '',
              street_name: companyData.street_name || '',
              city: companyData.city || '',
              province: companyData.province || '',
              postal_code: companyData.postal_code || '',
              country: companyData.country || '',
              status: companyData.status || '',
              fullAddress,
              phoneNumber: companyData.contact_number || companyData.phoneNumber || '',
              contactInfo: companyData.contactInfo || '',
            };
            setValue('company', selectedCompany);
          }
        }}
        list={mappedCompanyList}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={companyCreate.onTrue}
          >
            New
          </Button>
        }
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
            const clientData = address as any;

            // Construct full address from individual components
            const fullAddress =
              clientData.fullAddress ||
              clientData.display_address ||
              [
                clientData.unit_number,
                clientData.street_number,
                clientData.street_name,
                clientData.city,
                clientData.province,
                clientData.postal_code,
                clientData.country,
              ]
                .filter(Boolean)
                .join(', ');

            (setValue as any)('client', {
              id: clientData.id || '',
              region: clientData.region || '',
              name: clientData.name || '',
              logo_url: clientData.logo_url || '',
              email: clientData.email || '',
              contact_number: clientData.contact_number || clientData.phoneNumber || '',
              unit_number: clientData.unit_number || '',
              street_number: clientData.street_number || '',
              street_name: clientData.street_name || '',
              city: clientData.city || '',
              province: clientData.province || '',
              postal_code: clientData.postal_code || '',
              country: clientData.country || '',
              status: clientData.status || '',
              fullAddress,
              phoneNumber: clientData.contact_number || clientData.phoneNumber || '',
              contactInfo: clientData.contactInfo || '',
            });
          }
        }}
        list={mappedClientList}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={clientCreate.onTrue}
          >
            New
          </Button>
        }
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
            const siteData = address as any;
            (setValue as any)('site', {
              id: siteData.id || '',
              company_id: company?.id || '',
              name: siteData.name || '',
              email: siteData.email || '',
              contact_number: siteData.phoneNumber || '',
              unit_number: siteData.unit_number || '',
              street_number: siteData.street_number || '',
              street_name: siteData.street_name || '',
              city: siteData.city || '',
              province: siteData.province || '',
              postal_code: siteData.postal_code || '',
              country: siteData.country || '',
              status: siteData.status || '',
              fullAddress: siteData.fullAddress || '',
              phoneNumber: siteData.phoneNumber || '',
              contactInfo: siteData.contactInfo || '',
            });
          }
        }}
        list={mappedSiteList}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={siteCreate.onTrue}
            disabled={!company?.id}
          >
            New
          </Button>
        }
      />

      {/* Company Creation Dialog */}
      <CompanyQuickEditForm
        open={companyCreate.value}
        onClose={companyCreate.onFalse}
        onUpdateSuccess={async (createdCompany) => {
          // Close both dialogs immediately
          companyCreate.onFalse();
          addressForm.onFalse();

          // Extract ID from nested structure
          const companyId =
            (createdCompany as any)?.data?.id?.id ||
            (createdCompany as any)?.data?.id ||
            createdCompany?.id;

          if (companyId) {
            // Fetch the full company data after creation
            try {
              const response = await fetcher(`${endpoints.management.company}/${companyId}`);
              const fullCompanyData = response.data.company;

              if (fullCompanyData) {
                // Auto-select the newly created company
                const companyData = {
                  id: fullCompanyData.id || '',
                  region: fullCompanyData.region || '',
                  name: fullCompanyData.name || '',
                  logo_url: fullCompanyData.logo_url || '',
                  email: fullCompanyData.email || '',
                  contact_number: fullCompanyData.contact_number || '',
                  unit_number: fullCompanyData.unit_number || '',
                  street_number: fullCompanyData.street_number || '',
                  street_name: fullCompanyData.street_name || '',
                  city: fullCompanyData.city || '',
                  province: fullCompanyData.province || '',
                  postal_code: fullCompanyData.postal_code || '',
                  country: fullCompanyData.country || '',
                  status: fullCompanyData.status || '',
                  fullAddress: fullCompanyData.display_address || '',
                  phoneNumber: fullCompanyData.contact_number || '',
                };
                setValue('company', companyData);

                // Invalidate company queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['companies-all'] });
              }
            } catch (error) {
              console.error('Error fetching created company:', error);
              // Fallback to using the basic data we have
              if (createdCompany) {
                const fallbackData = {
                  id: companyId || '',
                  region: createdCompany.region || '',
                  name: createdCompany.name || '',
                  logo_url: createdCompany.logo_url || '',
                  email: createdCompany.email || '',
                  contact_number: createdCompany.contact_number || '',
                  unit_number: createdCompany.unit_number || '',
                  street_number: createdCompany.street_number || '',
                  street_name: createdCompany.street_name || '',
                  city: createdCompany.city || '',
                  province: createdCompany.province || '',
                  postal_code: createdCompany.postal_code || '',
                  country: createdCompany.country || '',
                  status: createdCompany.status || '',
                  fullAddress: createdCompany.display_address || '',
                  phoneNumber: createdCompany.contact_number || '',
                };
                setValue('company', fallbackData);
              }
            }
          }
        }}
      />

      {/* Client Creation Dialog */}
      <ClientQuickEditForm
        open={clientCreate.value}
        onClose={clientCreate.onFalse}
        onUpdateSuccess={async (createdClient) => {
          clientCreate.onFalse();
          addressTo.onFalse();
          const clientId = (createdClient as any)?.data?.id || createdClient?.id;
          if (clientId) {
            // Fetch the full client data after creation
            try {
              const response = await fetcher(`${endpoints.management.client}/${clientId}`);
              const fullClientData = response.data?.client || response.client;

              if (fullClientData) {
                // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
                const streetAddress = [
                  fullClientData.unit_number,
                  fullClientData.street_number,
                  fullClientData.street_name,
                ]
                  .filter(Boolean)
                  .join(' ');

                // Convert province name to code
                const getProvinceCode = (province: string) => {
                  const provinceMap: { [key: string]: string } = {
                    'British Columbia': 'BC',
                    Alberta: 'AB',
                    Saskatchewan: 'SK',
                    Manitoba: 'MB',
                    Ontario: 'ON',
                    Quebec: 'QC',
                    'New Brunswick': 'NB',
                    'Nova Scotia': 'NS',
                    'Prince Edward Island': 'PE',
                    'Newfoundland and Labrador': 'NL',
                    'Northwest Territories': 'NT',
                    Nunavut: 'NU',
                    Yukon: 'YT',
                  };
                  return provinceMap[province] || province;
                };

                const cityAddress = [
                  fullClientData.city,
                  getProvinceCode(fullClientData.province),
                  fullClientData.postal_code,
                ]
                  .filter(Boolean)
                  .join(' ');

                const fullAddress = [streetAddress, cityAddress].filter(Boolean).join('\n');

                // Format phone number: convert +17783493433 to (778) 349-3433
                const formatPhoneNumber = (phone: string) => {
                  if (!phone) return '';
                  const digits = phone.replace(/\D/g, '');
                  if (digits.length === 11 && digits.startsWith('1')) {
                    const withoutCountryCode = digits.substring(1);
                    return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
                  }
                  if (digits.length === 10) {
                    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                  }
                  return phone;
                };

                const formattedPhone = formatPhoneNumber(fullClientData.contact_number);

                // Format contact info: email | phone (if both exist)
                let contactInfo = '';
                if (fullClientData.email && formattedPhone) {
                  contactInfo = `${fullClientData.email} | ${formattedPhone}`;
                } else if (fullClientData.email) {
                  contactInfo = fullClientData.email;
                } else if (formattedPhone) {
                  contactInfo = formattedPhone;
                }

                // Auto-select the newly created client
                (setValue as any)('client', {
                  id: fullClientData.id || '',
                  region: fullClientData.region || '',
                  name: fullClientData.name || '',
                  logo_url: fullClientData.logo_url || '',
                  email: fullClientData.email || '',
                  contact_number: fullClientData.contact_number || '',
                  unit_number: fullClientData.unit_number || '',
                  street_number: fullClientData.street_number || '',
                  street_name: fullClientData.street_name || '',
                  city: fullClientData.city || '',
                  province: fullClientData.province || '',
                  postal_code: fullClientData.postal_code || '',
                  country: fullClientData.country || '',
                  status: fullClientData.status || '',
                  fullAddress,
                  phoneNumber: formattedPhone,
                  contactInfo,
                });

                // Invalidate client queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['clients-all'] });
              }
            } catch (error) {
              console.error('Error fetching created client:', error);
              // Fallback to using the basic data we have
              if (createdClient) {
                // Format address for fallback
                const streetAddress = [
                  createdClient.unit_number,
                  createdClient.street_number,
                  createdClient.street_name,
                ]
                  .filter(Boolean)
                  .join(' ');

                const getProvinceCode = (province: string) => {
                  const provinceMap: { [key: string]: string } = {
                    'British Columbia': 'BC',
                    Alberta: 'AB',
                    Saskatchewan: 'SK',
                    Manitoba: 'MB',
                    Ontario: 'ON',
                    Quebec: 'QC',
                    'New Brunswick': 'NB',
                    'Nova Scotia': 'NS',
                    'Prince Edward Island': 'PE',
                    'Newfoundland and Labrador': 'NL',
                    'Northwest Territories': 'NT',
                    Nunavut: 'NU',
                    Yukon: 'YT',
                  };
                  return provinceMap[province] || province;
                };

                const cityAddress = [
                  createdClient.city,
                  getProvinceCode(createdClient.province),
                  createdClient.postal_code,
                ]
                  .filter(Boolean)
                  .join(' ');

                const fullAddress = [streetAddress, cityAddress].filter(Boolean).join('\n');

                const formatPhoneNumber = (phone: string) => {
                  if (!phone) return '';
                  const digits = phone.replace(/\D/g, '');
                  if (digits.length === 11 && digits.startsWith('1')) {
                    const withoutCountryCode = digits.substring(1);
                    return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
                  }
                  if (digits.length === 10) {
                    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                  }
                  return phone;
                };

                const formattedPhone = formatPhoneNumber(createdClient.contact_number || '');

                let contactInfo = '';
                if (createdClient.email && formattedPhone) {
                  contactInfo = `${createdClient.email} | ${formattedPhone}`;
                } else if (createdClient.email) {
                  contactInfo = createdClient.email;
                } else if (formattedPhone) {
                  contactInfo = formattedPhone;
                }

                (setValue as any)('client', {
                  id: createdClient.id || '',
                  region: createdClient.region || '',
                  name: createdClient.name || '',
                  logo_url: createdClient.logo_url || '',
                  email: createdClient.email || '',
                  contact_number: createdClient.contact_number || '',
                  unit_number: createdClient.unit_number || '',
                  street_number: createdClient.street_number || '',
                  street_name: createdClient.street_name || '',
                  city: createdClient.city || '',
                  province: createdClient.province || '',
                  postal_code: createdClient.postal_code || '',
                  country: createdClient.country || '',
                  status: createdClient.status || '',
                  fullAddress,
                  phoneNumber: formattedPhone,
                  contactInfo,
                });

                // Invalidate client queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['clients-all'] });
              }
            }
          }
        }}
      />

      {/* Site Creation Dialog */}
      <SiteQuickEditForm
        open={siteCreate.value}
        onClose={siteCreate.onFalse}
        companyId={company?.id}
        onUpdateSuccess={async (createdSite) => {
          siteCreate.onFalse();
          addressSite.onFalse();

          // Extract ID from nested structure (similar to company)
          const siteId =
            (createdSite as any)?.data?.id?.id || (createdSite as any)?.data?.id || createdSite?.id;

          if (siteId) {
            // Fetch the full site data after creation
            try {
              const response = await fetcher(`${endpoints.management.site}/${siteId}`);
              const fullSiteData = response.data.site;

              if (fullSiteData) {
                // Auto-select the newly created site
                const siteData = {
                  id: fullSiteData.id || '',
                  company_id: company?.id || '',
                  name: fullSiteData.name || '',
                  email: fullSiteData.email || '',
                  contact_number: fullSiteData.contact_number || '',
                  unit_number: fullSiteData.unit_number || '',
                  street_number: fullSiteData.street_number || '',
                  street_name: fullSiteData.street_name || '',
                  city: fullSiteData.city || '',
                  province: fullSiteData.province || '',
                  postal_code: fullSiteData.postal_code || '',
                  country: fullSiteData.country || '',
                  status: fullSiteData.status || '',
                  fullAddress: fullSiteData.display_address || '',
                  phoneNumber: fullSiteData.contact_number || '',
                };
                (setValue as any)('site', siteData);

                // Invalidate site queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['sites-all'] });
                queryClient.invalidateQueries({ queryKey: ['sites-all', company?.id] });
              }
            } catch (error) {
              console.error('Error fetching created site:', error);
              // Fallback to using the basic data we have
              if (createdSite) {
                const fallbackSiteData = {
                  id: siteId || '',
                  company_id: company?.id || '',
                  name: createdSite.name || '',
                  email: createdSite.email || '',
                  contact_number: createdSite.contact_number || '',
                  unit_number: createdSite.unit_number || '',
                  street_number: createdSite.street_number || '',
                  street_name: createdSite.street_name || '',
                  city: createdSite.city || '',
                  province: createdSite.province || '',
                  postal_code: createdSite.postal_code || '',
                  country: createdSite.country || '',
                  status: createdSite.status || '',
                  fullAddress: createdSite.display_address || '',
                  phoneNumber: createdSite.contact_number || '',
                };
                (setValue as any)('site', fallbackSiteData);

                // Invalidate site queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['sites-all'] });
                queryClient.invalidateQueries({ queryKey: ['sites-all', company?.id] });
              }
            }
          }
        }}
      />
    </>
  );
}
