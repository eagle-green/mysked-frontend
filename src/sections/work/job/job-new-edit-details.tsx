import type { IUser } from 'src/types/user';
import type { IJobWorker, IJobVehicle, IJobEquipment } from 'src/types/job';
import type { IPreference, IEmployeePreferences, IEnhancedEmployee, IWorkerWarningDialog } from 'src/types/preference';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';
import {
  JOB_VEHICLE_OPTIONS,
  JOB_POSITION_OPTIONS,
  JOB_EQUIPMENT_OPTIONS,
} from 'src/assets/data/job';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { type AutocompleteWithAvatarOption } from 'src/components/hook-form/rhf-autocomplete-with-avatar';
import { EnhancedWorkerItem } from './enhanced-worker-item';

// ----------------------------------------------------------------------

export const defaultVehicle: Omit<IJobVehicle, 'id'> = {
  type: '',
  license_plate: '',
  unit_number: '',
  operator: {
    id: '',
    worker_index: null,
    first_name: '',
    last_name: '',
    position: '',
    photo_url: '',
  },
};

export const defaultWorker: Omit<IJobWorker, 'id'> = {
  position: '',
  user_id: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  start_time: null,
  end_time: null,
  photo_url: '',
};

export const defaultEquipment: Omit<IJobEquipment, 'id'> = {
  type: '',
  quantity: 1,
};

const getWorkerFieldNames = (index: number): Record<string, string> => ({
  position: `workers[${index}].position`,
  id: `workers[${index}].id`,
  first_name: `workers[${index}].first_name`,
  last_name: `workers[${index}].last_name`,
  start_time: `workers[${index}].start_time`,
  end_time: `workers[${index}].end_time`,
  photo_url: `workers[${index}].photo_url`,
  email: `workers[${index}].email`,
  phone_number: `workers[${index}].phone_number`,
});

const getVehicleFieldNames = (index: number) => ({
  type: `vehicles[${index}].type`,
  id: `vehicles[${index}].id`,
  license_plate: `vehicles[${index}].license_plate`,
  unit_number: `vehicles[${index}].unit_number`,
  operator: `vehicles[${index}].operator`,
  operator_id: `vehicles[${index}].operator.id`,
  operator_worker_index: `vehicles[${index}].operator.worker_index`,
  operator_first_name: `vehicles[${index}].operator.first_name`,
  operator_last_name: `vehicles[${index}].operator.last_name`,
  operator_position: `vehicles[${index}].operator.position`,
  operator_photo_url: `vehicles[${index}].operator.photo_url`,
});

const getEquipmentFieldNames = (index: number) => ({
  type: `equipments[${index}].type`,
  quantity: `equipments[${index}].quantity`,
});

export function JobNewEditDetails() {
  const { control, getValues, setValue, watch } = useFormContext();
  const note = watch('note');
  const [showNote, setShowNote] = useState(Boolean(note));
  // View All toggle for worker preferences
  const [viewAllWorkers, setViewAllWorkers] = useState(false);
  
  // Restriction warning state (legacy - kept for compatibility)
  const [restrictionWarning, setRestrictionWarning] = useState<any>({
    open: false,
    employee1: { name: '', id: '' },
    employee2: { name: '', id: '' },
    type: 'user',
    isMandatory: false,
    restrictionReason: '',
    workerFieldNamesToReset: undefined,
    pendingChecks: [],
  });

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control,
    name: 'vehicles',
  });
  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: 'equipments',
  });
  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({ control, name: 'workers' });

  // Fetch user list for employee autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.user}?status=active`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Get current company, site, and client IDs for preference fetching
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');

  // Fetch company preferences
  const { data: companyPreferences = [] } = useQuery({
    queryKey: ['company-preferences', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const response = await fetcher(`${endpoints.companyPreferences}?company_id=${currentCompany.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentCompany?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch site preferences
  const { data: sitePreferences = [] } = useQuery({
    queryKey: ['site-preferences', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const response = await fetcher(`${endpoints.sitePreference}?site_id=${currentSite.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentSite?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch client preferences
  const { data: clientPreferences = [] } = useQuery({
    queryKey: ['client-preferences', currentClient?.id],
    queryFn: async () => {
      if (!currentClient?.id) return [];
      const response = await fetcher(`${endpoints.clientPreferences}?client_id=${currentClient.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentClient?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Remove all restriction logic and API calls
  // If needed, use preferred/not_preferred fields on the main entity

  // Helper function to check user preferences
  const getUserPreferences = (userId: string) => {
    const company = companyPreferences.find((p: any) => 
      (p.employee?.id === userId || p.user?.id === userId)
    );
    const site = sitePreferences.find((p: any) => 
      (p.employee?.id === userId || p.user?.id === userId)
    );
    const client = clientPreferences.find((p: any) => 
      (p.employee?.id === userId || p.user?.id === userId)
    );

    return {
      company: company ? {
        type: company.preference_type,
        isMandatory: company.is_mandatory,
        reason: company.reason,
      } : null,
      site: site ? {
        type: site.preference_type,
        isMandatory: site.is_mandatory,
        reason: site.reason,
      } : null,
      client: client ? {
        type: client.preference_type,
        isMandatory: client.is_mandatory,
        reason: client.reason,
      } : null,
    };
  };

  // Helper function to determine employee display priority and styling
  const getEmployeeMetadata = (userId: string) => {
    const preferences = getUserPreferences(userId);
    
    // Check for mandatory not-preferred (highest priority - blocking)
    const hasMandatoryNotPreferred = 
      (preferences.company?.type === 'not_preferred' && preferences.company.isMandatory) ||
      (preferences.site?.type === 'not_preferred' && preferences.site.isMandatory) ||
      (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory);

    // Check for regular not-preferred  
    const hasNotPreferred = 
      (preferences.company?.type === 'not_preferred' && !preferences.company.isMandatory) ||
      (preferences.site?.type === 'not_preferred' && !preferences.site.isMandatory) ||
      (preferences.client?.type === 'not_preferred' && !preferences.client.isMandatory);

    // Count preferred preferences
    const preferredCount = [
      preferences.company?.type === 'preferred',
      preferences.site?.type === 'preferred', 
      preferences.client?.type === 'preferred'
    ].filter(Boolean).length;

    // Generate preference indicators (3 circles for Company|Site|Client)
    const preferenceIndicators = [
      preferences.company?.type === 'preferred',
      preferences.site?.type === 'preferred',
      preferences.client?.type === 'preferred'
    ];

    return {
      preferences,
      hasMandatoryNotPreferred,
      hasNotPreferred,
      hasPreferred: preferredCount > 0,
      preferredCount,
      preferenceIndicators,
      // Sorting priority: preferred first (by count), then regular, then not-preferred, then mandatory not-preferred (excluded by default)
      sortPriority: hasMandatoryNotPreferred ? 1000 : // Last (usually hidden)
                   hasNotPreferred ? 500 :              // Third  
                   preferredCount > 0 ? -preferredCount : // First (higher count = higher priority)
                   0,                                    // Second (neutral)
    };
  };

  const employeeOptions = userList
    ? userList.map((user: IUser) => {
        const metadata = getEmployeeMetadata(user.id);
        return {
          label: `${user.first_name} ${user.last_name}`,
          value: user.id,
          role: user.role,
          photo_url: user.photo_url,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          // Preference metadata
          ...metadata,
        };
             }).sort((a: any, b: any) => a.sortPriority - b.sortPriority) // Sort by preference priority
    : [];

  // Add a queue for pending user restrictions
  const [pendingUserRestrictions, setPendingUserRestrictions] = useState<any[]>([]);

  // Function to check for restrictions between two employees
  const checkRestrictions = (employee1Id: string, employee2Id: string) =>
    // This function is no longer used for user, client, or company restrictions
    null;
  // Function to check for client restrictions against an employee
  const checkClientRestrictions = (employeeId: string) =>
    // This function is no longer used for user, client, or company restrictions
    null;
  // Function to check for company restrictions against an employee
  const checkCompanyRestrictions = (employeeId: string) =>
    // This function is no longer used for user, client, or company restrictions
    null;
  // Function to get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employeeOptions.find((emp: any) => emp.value === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  // Function to get employee photo URL by ID
  const getEmployeePhotoUrl = (employeeId: string) => {
    const employee = employeeOptions.find((emp: any) => emp.value === employeeId);
    return employee?.photo_url || '';
  };

  // Function to show restriction warning
  const showRestrictionWarning = (employee1Id: string, employee2Id: string) =>
    // This function is no longer used for user, client, or company restrictions
    false;
  // Function to check if selected employee has any restrictions with existing workers
  const checkEmployeeRestrictions = (
    selectedEmployeeId: string,
    workerFieldNames?: Record<string, string>
  ) => {
    const workers = getValues('workers') || [];
    const existingWorkers = workers.filter((w: any) => w.id && w.id !== selectedEmployeeId);

    // Check company restrictions first
    const companyRestriction = checkCompanyRestrictions(selectedEmployeeId);
    if (companyRestriction) {
      // This code is no longer used as checkCompanyRestrictions returns null
      // TODO: Remove this block if company restrictions are handled elsewhere
    }

    // Check client restrictions
    const clientRestriction = checkClientRestrictions(selectedEmployeeId);
    if (clientRestriction) {
      const selectedEmployeeName = getEmployeeName(selectedEmployeeId);
      const clientName = 'This client'; // No client name available here

      setRestrictionWarning({
        open: true,
        employee1: {
          name: selectedEmployeeName,
          id: selectedEmployeeId,
          photo_url: getEmployeePhotoUrl(selectedEmployeeId),
        },
        employee2: {
          name: clientName,
          id: '', // No client ID available
          photo_url: '',
        },
        restrictionReason: (clientRestriction as any)?.reason || '',
        type: 'client',
        workerFieldNamesToReset: workerFieldNames,
        pendingChecks: [], // No pending checks for client
        isMandatory: (clientRestriction as any)?.is_mandatory || false,
      });
      return true; // Found a client restriction
    }

    // Collect all user restrictions
    const userRestrictions: any[] = [];
    for (const existingWorker of existingWorkers) {
      const restriction = checkRestrictions(selectedEmployeeId, existingWorker.id);
      if (restriction) {
        const selectedEmployeeName = getEmployeeName(selectedEmployeeId);
        const existingEmployeeName = getEmployeeName(existingWorker.id);
        const isSelectedEmployeeRestricting =
          (restriction as any)?.restricting_user?.id === selectedEmployeeId;
        const restrictingUser = isSelectedEmployeeRestricting
          ? (restriction as any)?.restricting_user
          : (restriction as any)?.restricted_user;
        const restrictedUser = isSelectedEmployeeRestricting
          ? (restriction as any)?.restricted_user
          : (restriction as any)?.restricting_user;
        userRestrictions.push({
          employee1: {
            name: selectedEmployeeName,
            id: selectedEmployeeId,
            photo_url: restrictingUser?.photo_url || '',
          },
          employee2: {
            name: existingEmployeeName,
            id: existingWorker.id,
            photo_url: restrictedUser?.photo_url || '',
          },
          restrictionReason: (restriction as any)?.reason || '',
          type: 'user',
          workerFieldNamesToReset: workerFieldNames,
          isMandatory: (restriction as any)?.is_mandatory || false,
        });
      }
    }
    if (userRestrictions.length > 0) {
      // Show the first restriction and queue the rest
      const [first, ...rest] = userRestrictions;
      setRestrictionWarning({
        open: true,
        ...first,
        pendingChecks: [],
      });
      setPendingUserRestrictions(rest);
      return true;
    }
    setPendingUserRestrictions([]);
    return false; // No restrictions found
  };

  // Function to handle "Proceed Anyway" - check for next restriction type or next user restriction
  const handleProceedAnyway = () => {
    const { employee1, pendingChecks, isMandatory } = restrictionWarning;

    // If this is a mandatory restriction, don't allow proceeding
    if (isMandatory) {
      return;
    }

    if (pendingChecks && pendingChecks.length > 0) {
      // Check next restriction type (company/client logic)
      const nextCheckType = pendingChecks[0];
      const remainingChecks = pendingChecks.slice(1);

      if (nextCheckType === 'client') {
        const clientRestriction = checkClientRestrictions(employee1.id);
        if (clientRestriction) {
          const clientName = 'This client'; // No client name available here
          setRestrictionWarning({
            open: true,
            employee1: { name: employee1.name, id: employee1.id, photo_url: employee1.photo_url },
            employee2: {
              name: clientName,
              id: '', // No client ID available
              photo_url: '',
            },
            restrictionReason: (clientRestriction as any)?.reason || '',
            type: 'client',
            workerFieldNamesToReset: restrictionWarning.workerFieldNamesToReset,
            pendingChecks: remainingChecks,
            isMandatory: (clientRestriction as any)?.is_mandatory || false,
          });
          return;
        }
      } else if (nextCheckType === 'user') {
        // If there are pending user restrictions, show them
        if (pendingUserRestrictions.length > 0) {
          const [next, ...rest] = pendingUserRestrictions;
          setRestrictionWarning({
            open: true,
            ...next,
            pendingChecks: [],
          });
          setPendingUserRestrictions(rest);
          return;
        }
        // Otherwise, check for user restrictions as before (should be none left)
      }

      // If no restriction found for this type, check next type
      if (remainingChecks.length > 0) {
        setRestrictionWarning((prev) => ({ ...prev, pendingChecks: remainingChecks }));
        // Process the next check in the next tick to avoid recursion
        processNextCheck(remainingChecks, employee1);
      } else {
        setRestrictionWarning((prev) => ({ ...prev, open: false }));
      }
      return;
    }

    // If there are pending user restrictions, show them
    if (pendingUserRestrictions.length > 0) {
      const [next, ...rest] = pendingUserRestrictions;
      setRestrictionWarning({
        open: true,
        ...next,
        pendingChecks: [],
      });
      setPendingUserRestrictions(rest);
      return;
    }

    // No more checks, close dialog and allow employee
    setRestrictionWarning((prev) => ({ ...prev, open: false }));
  };

  // Helper function to process the next check without recursion
  const processNextCheck = (checks: ('client' | 'user')[], employee1: any) => {
    if (checks.length === 0) {
      setRestrictionWarning((prev) => ({ ...prev, open: false }));
      return;
    }

    const nextCheckType = checks[0];
    const remainingChecks = checks.slice(1);

    if (nextCheckType === 'client') {
      const clientRestriction = checkClientRestrictions(employee1.id);
      if (clientRestriction) {
        const clientName = 'This client'; // No client name available here
        setRestrictionWarning({
          open: true,
          employee1: { name: employee1.name, id: employee1.id, photo_url: employee1.photo_url },
          employee2: {
            name: clientName,
            id: '', // No client ID available
            photo_url: '',
          },
          restrictionReason: (clientRestriction as any)?.reason || '',
          type: 'client',
          workerFieldNamesToReset: restrictionWarning.workerFieldNamesToReset,
          pendingChecks: remainingChecks,
          isMandatory: (clientRestriction as any)?.is_mandatory || false,
        });
        return;
      }
    } else if (nextCheckType === 'user') {
      if (pendingUserRestrictions.length > 0) {
        const [next, ...rest] = pendingUserRestrictions;
        setRestrictionWarning({
          open: true,
          ...next,
          pendingChecks: [],
        });
        setPendingUserRestrictions(rest);
        return;
      }
    }

    // If no restriction found for this type, check next type
    if (remainingChecks.length > 0) {
      setRestrictionWarning((prev) => ({ ...prev, pendingChecks: remainingChecks }));
      processNextCheck(remainingChecks, employee1);
    } else {
      setRestrictionWarning((prev) => ({ ...prev, open: false }));
    }
  };

  // Fetch client list for client autocomplete (if present)
  useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetcher(endpoints.client);
      return response.data.clients;
    },
  });

  const watchedWorkers = watch('workers');

  // Ensure there's always at least one worker
  useEffect(() => {
    const currentWorkers = getValues('workers') || [];
    if (currentWorkers.length === 0) {
      const { start_date_time, end_date_time } = getValues();
      appendWorker({
        ...defaultWorker,
        id: '',
        first_name: '',
        last_name: '',
        photo_url: '',
        start_time: start_date_time || null,
        end_time: end_date_time || null,
        status: 'draft',
      });
    }
  }, [getValues, appendWorker]);

  // Track removed vehicles to prevent restoration
  const removedVehiclesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // When workers change, remove vehicles if their assigned worker is removed
    const currentWorkers = getValues('workers') || [];
    const currentVehicles = getValues('vehicles') || [];

    // Find vehicles that have operators who no longer exist
    const vehiclesToRemove: number[] = [];
    currentVehicles.forEach((vehicle: any, vIdx: number) => {
      if (vehicle.operator && vehicle.operator.id) {
        const stillExists = currentWorkers.some((w: any) => w.id === vehicle.operator.id);
        if (!stillExists) {
          // Create a unique key for this vehicle to track it
          const vehicleKey = `${vehicle.operator.id}_${vehicle.type}_${vehicle.id}`;
          removedVehiclesRef.current.add(vehicleKey);
          vehiclesToRemove.push(vIdx);
        }
      }
    });

    // Remove vehicles in reverse order to maintain correct indices
    if (vehiclesToRemove.length > 0) {
      vehiclesToRemove.reverse().forEach((vIdx: number) => {
        removeVehicle(vIdx);
      });
    }
  }, [watchedWorkers, getValues, removeVehicle]);

  // Function to handle dialog cancel - reset employee selection
  const handleDialogCancel = () => {
    if (restrictionWarning.workerFieldNamesToReset) {
      // Reset the employee selection
      setValue(restrictionWarning.workerFieldNamesToReset.id, '');
      setValue(restrictionWarning.workerFieldNamesToReset.first_name, '');
      setValue(restrictionWarning.workerFieldNamesToReset.last_name, '');
      setValue(restrictionWarning.workerFieldNamesToReset.photo_url, '');

      // Find the worker index and reset status
      const match = restrictionWarning.workerFieldNamesToReset.id.match(/workers\[(\d+)\]\.id/);
      if (match) {
        const workerIndex = Number(match[1]);
        setValue(`workers[${workerIndex}].status`, 'draft');
      }
    }

    // Close the dialog
    setRestrictionWarning((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled' }}>
          Workers:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            View All
          </Typography>
          <Field.Switch
            name="viewAllWorkers"
            label=""
            checked={viewAllWorkers}
            onChange={(_event, checked) => setViewAllWorkers(checked)}
          />
        </Box>
      </Box>

      {(!getValues('client')?.id || !getValues('company')?.id) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Please select a <strong>Client</strong> and <strong>Company</strong> first before adding
            workers.
          </Typography>
        </Alert>
      )}

      <Stack spacing={3}>
        {workerFields.map((item, index) => (
          <EnhancedWorkerItem
            key={item.id}
            workerFieldNames={getWorkerFieldNames(index)}
            onRemoveWorkerItem={() => {
              // Prevent removing the last worker
              if (workerFields.length > 1) {
                removeWorker(index);
              }
            }}
            employeeOptions={employeeOptions}
            position={getValues(`workers[${index}].position`)}
            canRemove={workerFields.length > 1}
            removeVehicle={removeVehicle}
            viewAllWorkers={viewAllWorkers}
          />
        ))}
      </Stack>
      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => {
          const { start_date_time, end_date_time, client, company } = getValues();

          // Check if client and company are selected
          if (!client?.id || !company?.id) {
            // You could show a toast or alert here
            console.warn('Please select client and company first');
            return;
          }

          appendWorker({
            ...defaultWorker,
            id: '',
            first_name: '',
            last_name: '',
            photo_url: '',
            start_time: start_date_time || null,
            end_time: end_date_time || null,
            status: 'draft',
          });
          setValue('status', 'draft');
        }}
        disabled={!getValues('client')?.id || !getValues('company')?.id}
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Worker
      </Button>

      {(() => {
        const workers = getValues('workers');
        const hasValidWorker = workers?.some(
          (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
        );

        return (
          !hasValidWorker && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> At least one worker with position and employee is required
                for every job.
              </Typography>
            </Alert>
          )
        );
      })()}

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Vehicles:
      </Typography>

      {!getValues('workers')?.some(
        (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
      ) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Please add <strong>Workers</strong> first before adding vehicles. Vehicles require
            operators who must be selected from the assigned workers.
          </Typography>
        </Alert>
      )}

      <Stack spacing={3}>
        {vehicleFields.map((item, index) => (
          <VehicleItem
            key={item.id}
            fieldNames={getVehicleFieldNames(index)}
            onRemoveVehicleItem={() => removeVehicle(index)}
          />
        ))}
      </Stack>
      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() =>
          appendVehicle({
            type: '',
            id: '',
            license_plate: '',
            unit_number: '',
            operator: {
              id: '',
              first_name: '',
              last_name: '',
              photo_url: '',
              worker_index: null,
            },
          })
        }
        disabled={
          !getValues('workers')?.some(
            (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
          )
        }
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Vehicle
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Equipments:
      </Typography>

      <Stack spacing={3}>
        {equipmentFields.map((item, index) => (
          <EquipmentItem
            key={item.id}
            fieldNames={getEquipmentFieldNames(index)}
            onRemoveEquipmentItem={() => removeEquipment(index)}
          />
        ))}
      </Stack>
      <Button
        size="small"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => appendEquipment({ type: '', quantity: 1 })}
        sx={{ mt: 2, flexShrink: 0 }}
      >
        Add Equipment
      </Button>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      {!showNote ? (
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setShowNote(true)}
          sx={{ mt: 2, flexShrink: 0 }}
        >
          Add Note
        </Button>
      ) : (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Field.Text name="note" label="Note" multiline rows={4} fullWidth />
          <Button
            size="small"
            color="error"
            onClick={() => {
              setValue('note', ''); // Clear the note content
              setShowNote(false);
            }}
            sx={{ mt: 1 }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </Button>
        </Box>
      )}

      {/* Restriction Warning Dialog */}
      <Dialog open={restrictionWarning.open} onClose={handleDialogCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {restrictionWarning.isMandatory
            ? restrictionWarning.type === 'client'
              ? 'Client Restriction Error'
              : restrictionWarning.type === 'company'
                ? 'Company Access Restriction Error'
                : 'Employee Restriction Error'
            : restrictionWarning.type === 'client'
              ? 'Client Restriction Warning'
              : restrictionWarning.type === 'company'
                ? 'Company Access Restriction Warning'
                : 'Employee Restriction Warning'}
        </DialogTitle>
        <DialogContent>
          <Alert severity={restrictionWarning.isMandatory ? 'error' : 'warning'} sx={{ mb: 2 }}>
            {restrictionWarning.type === 'company' ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{restrictionWarning.employee1.name}</strong> has added{' '}
                  <strong>{restrictionWarning.employee2.name}</strong> to their &ldquo;Company
                  Access Restrictions&rdquo; list.
                </Typography>
                {restrictionWarning.restrictionReason && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reason:</strong> {restrictionWarning.restrictionReason}
                  </Typography>
                )}
                {restrictionWarning.isMandatory ? (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                    ⚠️ This is a <strong>Mandatory Restriction</strong>. This employee cannot be
                    assigned to any jobs at this company.
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    You can still proceed to add this employee to the job, but please be aware that
                    the company has restricted access for them.
                  </Typography>
                )}
              </>
            ) : restrictionWarning.type === 'client' ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{restrictionWarning.employee2.name}</strong> has added{' '}
                  <strong>{restrictionWarning.employee1.name}</strong> to their &ldquo;Client Work
                  Restrictions&rdquo; list.
                </Typography>
                {restrictionWarning.restrictionReason && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reason:</strong> {restrictionWarning.restrictionReason}
                  </Typography>
                )}
                {restrictionWarning.isMandatory ? (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                    ⚠️ This is a <strong>Mandatory Restriction</strong>. This employee cannot be
                    assigned to any jobs for this client.
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    You can still proceed to add this employee to the job, but please be aware that
                    the client has requested not to work with them.
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{restrictionWarning.employee1.name}</strong> has added{' '}
                  <strong>{restrictionWarning.employee2.name}</strong> to their &ldquo;Team Work
                  Restrictions&rdquo; list.
                </Typography>
                {restrictionWarning.restrictionReason && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reason:</strong> {restrictionWarning.restrictionReason}
                  </Typography>
                )}
                {restrictionWarning.isMandatory ? (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                    ⚠️ This is a <strong>Mandatory Restriction</strong>. These employees cannot be
                    assigned to the same job.
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    You can still proceed to add both employees to this job, but please be aware of
                    this restriction.
                  </Typography>
                )}
              </>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel} color="inherit">
            Cancel
          </Button>
          {!restrictionWarning.isMandatory && (
            <Button onClick={handleProceedAnyway} variant="contained" color="warning">
              Proceed Anyway
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ----------------------------------------------------------------------

type WorkerItemProps = {
  onRemoveWorkerItem: () => void;
  workerFieldNames: Record<string, string>;
  employeeOptions: {
    label: string;
    value: string;
    role: string;
    photo_url: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }[];
  position: string;
  showRestrictionWarning: (emp1Id: string, emp2Id: string) => boolean;
  checkEmployeeRestrictions: (
    selectedEmployeeId: string,
    workerFieldNames?: Record<string, string>
  ) => boolean;
  canRemove: boolean;
  removeVehicle: (index: number) => void;
};

type VehicleItemProps = {
  onRemoveVehicleItem: () => void;
  fieldNames: {
    type: string;
    id: string;
    license_plate: string;
    unit_number: string;
    operator: string;
    operator_id: string;
    operator_worker_index: string;
    operator_first_name: string;
    operator_last_name: string;
    operator_position: string;
    operator_photo_url: string;
  };
};

type EquipmentItemProps = {
  onRemoveEquipmentItem: () => void;
  fieldNames: {
    type: string;
    quantity: string;
  };
};

export function WorkerItem({
  onRemoveWorkerItem,
  workerFieldNames,
  employeeOptions,
  position,
  showRestrictionWarning,
  checkEmployeeRestrictions,
  canRemove,
  removeVehicle,
}: WorkerItemProps) {
  const {
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const vehicleThemeInner = useTheme();
  const isXsSmMd = useMediaQuery(vehicleThemeInner.breakpoints.down('md'));
  const workers = watch('workers') || [];
  const startDateTime = watch('start_date_time');
  const endDateTime = watch('end_date_time');

  // Watch the current position and employee values for this worker
  const currentPosition = watch(workerFieldNames.position);
  const currentEmployeeId = watch(workerFieldNames.id);

  // Find the index of this worker row
  const thisWorkerIndex = Number(workerFieldNames.id.match(/workers\[(\d+)\]\.id/)?.[1] ?? -1);

  // Collect all selected employee ids from other worker rows
  const pickedEmployeeIds = workers
    .map((w: any, idx: number) => (idx !== thisWorkerIndex ? w.id : null))
    .filter(Boolean);

  // Filter employees by role matching the selected position and not already picked
  const filteredOptions = currentPosition
    ? employeeOptions.filter((emp) => {
        if (!emp.role) return false;
        const roleMatch = emp.role
          .split('/')
          .map((r: string) => r.trim().toLowerCase())
          .includes(currentPosition.trim().toLowerCase());
        const alreadyPicked = pickedEmployeeIds.includes(emp.value);
        return roleMatch && !alreadyPicked;
      })
    : employeeOptions.filter((emp) => !pickedEmployeeIds.includes(emp.value));

  // Get the currently selected employee option for the autocomplete
  const selectedEmployeeOption = currentEmployeeId
    ? filteredOptions.find((emp) => emp.value === currentEmployeeId) || null
    : null;

  // Get error for this worker's id
  let employeeError = undefined;
  const match = workerFieldNames.id.match(/workers\[(\d+)\]\.id/);
  if (match) {
    const idx = Number(match[1]);
    const workerErrors = errors?.workers as unknown as any[];
    employeeError = workerErrors?.[idx]?.id?.message;
  }

  // Update worker times when job times change
  useEffect(() => {
    if (startDateTime || endDateTime) {
      const currentStartTime = getValues(workerFieldNames.start_time);
      const currentEndTime = getValues(workerFieldNames.end_time);

      // Only update if we have a time value
      if (currentStartTime && startDateTime) {
        const newStartTime = new Date(startDateTime);
        // Get hours and minutes from the current start time
        if (currentStartTime instanceof Date) {
          newStartTime.setHours(currentStartTime.getHours(), currentStartTime.getMinutes());
          setValue(workerFieldNames.start_time, newStartTime);
        }
      }

      if (currentEndTime && endDateTime) {
        const newEndTime = new Date(endDateTime);
        // Get hours and minutes from the current end time
        if (currentEndTime instanceof Date) {
          newEndTime.setHours(currentEndTime.getHours(), currentEndTime.getMinutes());

          // Check if this would result in a negative duration (overnight shift)
          const workerStartTime = getValues(workerFieldNames.start_time);
          if (workerStartTime instanceof Date) {
            const startTime = dayjs(workerStartTime);
            const endTime = dayjs(newEndTime);
            const duration = endTime.diff(startTime, 'hour');

            if (duration < 0) {
              // This is an overnight shift, add one day to the end time
              newEndTime.setDate(newEndTime.getDate() + 1);
            }
          }

          setValue(workerFieldNames.end_time, newEndTime);
        }
      }
    }
  }, [
    startDateTime,
    endDateTime,
    workerFieldNames.start_time,
    workerFieldNames.end_time,
    getValues,
    setValue,
  ]);

  // Reset employee selection when position changes
  useEffect(() => {
    // If position changed and there's a selected employee, check if they're still qualified
    if (currentPosition && currentEmployeeId) {
      const selectedEmployee = employeeOptions.find((emp: any) => emp.value === currentEmployeeId);
      if (selectedEmployee) {
        const roleMatch = selectedEmployee.role
          ?.split('/')
          .map((r: string) => r.trim().toLowerCase())
          .includes(currentPosition.trim().toLowerCase());

        // If employee is not qualified for the new position, reset the selection and remove assigned vehicles
        if (!roleMatch) {
          setValue(workerFieldNames.id, '');
          setValue(workerFieldNames.first_name, '');
          setValue(workerFieldNames.last_name, '');
          setValue(workerFieldNames.photo_url, '');
          setValue(workerFieldNames.email, '');
          setValue(workerFieldNames.phone_number, '');
          setValue(`workers[${thisWorkerIndex}].status`, 'draft');

          // Remove any vehicles assigned to this worker
          const currentVehicles = getValues('vehicles') || [];
          const vehiclesToRemove: number[] = [];
          currentVehicles.forEach((vehicle: any, vIdx: number) => {
            if (vehicle.operator && vehicle.operator.id === currentEmployeeId) {
              vehiclesToRemove.push(vIdx);
            }
          });

          // Remove vehicles in reverse order to maintain correct indices
          if (vehiclesToRemove.length > 0) {
            vehiclesToRemove.reverse().forEach((vIdx: number) => {
              removeVehicle(vIdx);
            });
          }
        }
      }
    }
  }, [
    currentPosition,
    currentEmployeeId,
    workerFieldNames,
    setValue,
    employeeOptions,
    thisWorkerIndex,
    getValues,
    removeVehicle,
  ]);

  return (
    <Box
      sx={{
        gap: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
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
        <Field.Select
          size="small"
          name={workerFieldNames.position}
          label={
            !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
              ? 'Select company/site/client first'
              : 'Position*'
          }
          disabled={
            workers[thisWorkerIndex]?.status === 'accepted' ||
            workers[thisWorkerIndex]?.status === 'pending' ||
            !getValues('client')?.id ||
            !getValues('company')?.id ||
            !getValues('site')?.id
          }
        >
          {JOB_POSITION_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Controller
          name={workerFieldNames.id}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Field.AutocompleteWithAvatar
              {...field}
              label={
                !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                  ? 'Select company/site/client first'
                  : currentPosition
                    ? 'Employee*'
                    : 'Select position first'
              }
              placeholder={
                !getValues('client')?.id || !getValues('company')?.id || !getValues('site')?.id
                  ? 'Select company/site/client first'
                  : currentPosition
                    ? 'Search an employee'
                    : 'Select position first'
              }
              options={filteredOptions}
              value={selectedEmployeeOption}
              disabled={
                !currentPosition ||
                workers[thisWorkerIndex]?.status === 'accepted' ||
                workers[thisWorkerIndex]?.status === 'pending' ||
                !getValues('client')?.id ||
                !getValues('company')?.id
              }
              helperText={employeeError}
              fullWidth
              slotProps={{
                textfield: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              multiple={false}
              onChange={(
                _event: React.SyntheticEvent<Element, Event>,
                value:
                  | AutocompleteWithAvatarOption
                  | string
                  | (AutocompleteWithAvatarOption | string)[]
                  | null,
                _reason: any,
                _details?: any
              ) => {
                // Only handle if value is an object (option) or null (ignore array, which shouldn't happen for single-select)
                if (Array.isArray(value)) return;
                if (value && typeof value === 'object' && 'value' in value) {
                  field.onChange(value.value);
                  setValue(workerFieldNames.first_name, value.first_name);
                  setValue(workerFieldNames.last_name, value.last_name);
                  setValue(workerFieldNames.photo_url, value.photo_url);
                  setValue(`workers[${thisWorkerIndex}].email`, value.email || '');
                  setValue(`workers[${thisWorkerIndex}].phone_number`, value.phone_number || '');
                  setValue(`workers[${thisWorkerIndex}].status`, 'draft');

                  // Check for restrictions immediately when employee is selected
                  checkEmployeeRestrictions(value.value, workerFieldNames);
                } else {
                  field.onChange('');
                  setValue(workerFieldNames.first_name, '');
                  setValue(workerFieldNames.last_name, '');
                  setValue(workerFieldNames.photo_url, '');
                  setValue(`workers[${thisWorkerIndex}].email`, '');
                  setValue(`workers[${thisWorkerIndex}].phone_number`, '');
                  setValue(`workers[${thisWorkerIndex}].status`, 'draft');
                }
              }}
            />
          )}
        />

        <Field.TimePicker
          name={workerFieldNames.start_time}
          label="Start Time"
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        <Field.TimePicker
          name={workerFieldNames.end_time}
          label="End Time"
          shouldDisableTime={(value, view) => {
            if (view === 'hours' || view === 'minutes') {
              // Get the worker's start time
              const workerStartTime = getValues(workerFieldNames.start_time);
              if (workerStartTime instanceof Date) {
                const startTime = dayjs(workerStartTime);
                const endTime = dayjs(value);

                // If it's the same day, disable times before start time
                if (startTime.isSame(endTime, 'day')) {
                  const startTimeOnly = startTime.format('HH:mm');
                  const endTimeOnly = endTime.format('HH:mm');
                  return endTimeOnly < startTimeOnly;
                }
              }
            }
            return false;
          }}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveWorkerItem}
            disabled={!canRemove}
            sx={{ px: 4.5, mt: 1 }}
          >
            Remove
          </Button>
        )}
      </Box>
      {isXsSmMd && (
        <Button
          size="small"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={onRemoveWorkerItem}
          disabled={!canRemove}
        >
          Remove
        </Button>
      )}
    </Box>
  );
}

export function VehicleItem({ onRemoveVehicleItem, fieldNames }: VehicleItemProps) {
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const vehicleThemeInner = useTheme();
  const isXsSmMd = useMediaQuery(vehicleThemeInner.breakpoints.down('md'));
  const workers = watch('workers') || [];
  const vehicleList = watch('vehicles') || [];

  // Get the current vehicle index and data
  const thisVehicleIndex = Number(
    fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/)?.[1] ?? -1
  );
  const thisVehicle = vehicleList[thisVehicleIndex] as IJobVehicle;
  const selectedVehicleId = thisVehicle?.id;
  const selectedVehicleType = thisVehicle?.type;

  // Collect all selected operator worker references (id + worker_index) from other vehicles
  const pickedOperators = vehicleList
    .map((v: any, idx: number) =>
      idx !== thisVehicleIndex && v.operator ? `${v.operator.id}__${v.operator.worker_index}` : null
    )
    .filter(Boolean);
  const operatorOptions = workers
    .filter((w: any) => w && w.id && w.position && (w.first_name || w.last_name))
    .map((w: any, idx: number) => {
      const positionLabel =
        JOB_POSITION_OPTIONS.find((opt) => opt.value === w.position)?.label || w.position || '';
      return {
        label: `${w.first_name || ''} ${w.last_name || ''} (${positionLabel})`.trim(),
        value: `${w.id}__${idx}`,
        id: w.id,
        first_name: w.first_name,
        last_name: w.last_name,
        position: w.position,
        positionLabel,
        photo_url: w.photo_url || '',
        workerIndex: idx,
      };
    })
    .filter((opt: { value: string }) => !pickedOperators.includes(opt.value));

  // Get the current operator value
  const currentOperator = watch(fieldNames.operator);
  const currentOperatorWorker = currentOperator?.id
    ? workers.find((w: any) => w.id === currentOperator.id)
    : null;

  // If we have a current operator but no photo_url, update it
  if (currentOperator?.id && !currentOperator.photo_url && currentOperatorWorker?.photo_url) {
    setValue(fieldNames.operator, {
      ...currentOperator,
      photo_url: currentOperatorWorker.photo_url,
    });
  }

  // Fetch vehicle options based on type and operator
  const { data: vehicleOptionsData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicleOptions', selectedVehicleType, currentOperator?.id],
    queryFn: async () => {
      // If we have an operator and vehicle type, get their assigned vehicles of that type
      if (currentOperator?.id && selectedVehicleType) {
        const response = await fetcher(
          `${endpoints.vehicle}?status=active&operator_id=${currentOperator.id}&type=${selectedVehicleType}`
        );
        return response.data;
      }
      // If no operator or type selected, return empty array
      return { vehicles: [] };
    },
    enabled: !!currentOperator?.id && !!selectedVehicleType,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
  });

  const vehicleOptions = useMemo(() => {
    const vehicles = vehicleOptionsData?.vehicles || [];

    const mappedVehicles = vehicles.map((vehicle: any) => ({
      ...vehicle,
      label: `${vehicle.license_plate} - ${vehicle.unit_number}`,
      value: vehicle.id,
    }));

    return { mappedVehicles, assignedVehicleIds: [] };
  }, [vehicleOptionsData]);

  // Find the current vehicle data - only if it's explicitly selected
  const currentVehicle = selectedVehicleId
    ? vehicleOptions.mappedVehicles.find((v: any) => v.id === selectedVehicleId) || null
    : null;

  // Get helper text based on current state
  const getVehicleHelperText = () => {
    const vehicleErrors = errors.vehicles as any;
    const vehicleError = vehicleErrors?.[thisVehicleIndex];
    if (vehicleError?.id?.message) {
      return vehicleError.id.message;
    }
    return '';
  };

  // Vehicle number field logic
  const vehicleNumberField = (
    <Autocomplete
      fullWidth
      disablePortal
      id={`vehicle-number-${thisVehicleIndex}`}
      size="small"
      disabled={!selectedVehicleType || !currentOperator?.id || isLoadingVehicles}
      options={vehicleOptions.mappedVehicles}
      value={currentVehicle}
      loading={isLoadingVehicles}
      onChange={(event, newValue) => {
        if (newValue) {
          setValue(`vehicles[${thisVehicleIndex}].id`, newValue.id);
          setValue(`vehicles[${thisVehicleIndex}].license_plate`, newValue.license_plate);
          setValue(`vehicles[${thisVehicleIndex}].unit_number`, newValue.unit_number);
        } else {
          setValue(`vehicles[${thisVehicleIndex}].id`, '');
          setValue(`vehicles[${thisVehicleIndex}].license_plate`, '');
          setValue(`vehicles[${thisVehicleIndex}].unit_number`, '');
        }
      }}
      getOptionLabel={(option) => {
        if (!option) return '';
        return option.label || `${option.license_plate} - ${option.unit_number}`;
      }}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      renderInput={(params) => {
        const vehicleErrors = errors.vehicles as any;
        const vehicleError = vehicleErrors?.[thisVehicleIndex];
        const label = !currentOperator?.id
          ? 'Select operator first'
          : !selectedVehicleType
            ? 'Select vehicle type first'
            : 'Vehicle*';
        const placeholder = !currentOperator?.id
          ? 'Select operator first'
          : !selectedVehicleType
            ? 'Select vehicle type first'
            : isLoadingVehicles
              ? 'Loading vehicles...'
              : 'Select vehicle';

        return (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!vehicleError?.id}
            helperText={getVehicleHelperText()}
            disabled={!selectedVehicleType || !currentOperator?.id || isLoadingVehicles}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingVehicles ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        );
      }}
    />
  );

  // Get error for this vehicle's operator.id
  let operatorError = undefined;
  const matchOp = fieldNames.operator.match(/vehicles\[(\d+)\]\.operator/);
  if (matchOp) {
    const idx = Number(matchOp[1]);
    const vehicleErrors = errors?.vehicles as unknown as any[];
    operatorError = vehicleErrors?.[idx]?.operator?.id?.message;
  }

  const colorByName = (name?: string) => {
    const charAt = name?.charAt(0).toLowerCase();

    if (['a', 'c', 'f'].includes(charAt!)) return 'primary';
    if (['e', 'd', 'h'].includes(charAt!)) return 'secondary';
    if (['i', 'k', 'l'].includes(charAt!)) return 'info';
    if (['m', 'n', 'p'].includes(charAt!)) return 'success';
    if (['q', 's', 't'].includes(charAt!)) return 'warning';
    if (['v', 'x', 'y'].includes(charAt!)) return 'error';

    return 'default';
  };

  const getAvatarColor = (option: any) => {
    const displayName = option.first_name || option.last_name || '';
    return colorByName(displayName);
  };

  return (
    <Box
      sx={{
        gap: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
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
        <Controller
          name={fieldNames.operator}
          control={control}
          defaultValue={{
            id: '',
            worker_index: null,
            first_name: '',
            last_name: '',
            position: '',
            photo_url: '',
          }}
          render={({ field }) => {
            const selectedOperator =
              operatorOptions.find(
                (opt: any) =>
                  opt.id === field.value?.id && opt.workerIndex === field.value?.worker_index
              ) || null;
            return (
              <Autocomplete
                size="small"
                {...field}
                fullWidth
                disabled={
                  workers.length === 0 ||
                  workers.every(
                    (w: any) => !w.id || w.id === '' || !w.position || w.position === ''
                  )
                }
                options={operatorOptions}
                getOptionLabel={(option: any) =>
                  option?.label ||
                  [option?.first_name, option?.last_name].filter(Boolean).join(' ') ||
                  ''
                }
                isOptionEqualToValue={(option: any, value: any) => option.value === value.value}
                value={selectedOperator}
                onChange={(_: any, newValue: any) => {
                  if (newValue) {
                    const selectedWorker = workers[newValue.workerIndex];
                    setValue(fieldNames.operator, {
                      id: newValue.id,
                      worker_index: newValue.workerIndex,
                      first_name: newValue.first_name,
                      last_name: newValue.last_name,
                      position: newValue.position,
                      photo_url: selectedWorker?.photo_url || newValue.photo_url || '',
                    });
                    // Reset vehicle type and vehicle when operator changes
                    setValue(fieldNames.type, '');
                    setValue(fieldNames.id, '');
                    setValue(fieldNames.license_plate, '');
                    setValue(fieldNames.unit_number, '');
                  } else {
                    setValue(fieldNames.operator, {
                      id: '',
                      worker_index: null,
                      first_name: '',
                      last_name: '',
                      position: '',
                      photo_url: '',
                    });
                    // Reset vehicle type and vehicle when operator is cleared
                    setValue(fieldNames.type, '');
                    setValue(fieldNames.id, '');
                    setValue(fieldNames.license_plate, '');
                    setValue(fieldNames.unit_number, '');
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  const fallbackLetter =
                    option.first_name?.charAt(0).toUpperCase() ||
                    option.last_name?.charAt(0).toUpperCase() ||
                    '?';
                  return (
                    <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={option.photo_url || ''}
                        sx={{
                          width: 26,
                          height: 26,
                          fontSize: 15,
                          mr: 1,
                          bgcolor: (vehicleThemeOption) => {
                            const paletteColor = (vehicleThemeOption.palette as any)[
                              getAvatarColor(option)
                            ];
                            return paletteColor?.main || vehicleThemeOption.palette.grey[500];
                          },
                        }}
                      >
                        {!option.photo_url && fallbackLetter}
                      </Avatar>
                      {option.label}
                    </li>
                  );
                }}
                renderInput={(params: any) => {
                  const selected = operatorOptions.find(
                    (opt: any) =>
                      opt.id === watch(fieldNames.operator)?.id &&
                      opt.workerIndex === watch(fieldNames.operator)?.worker_index
                  );
                  const fallbackLetter =
                    selected?.first_name?.charAt(0).toUpperCase() ||
                    selected?.last_name?.charAt(0).toUpperCase() ||
                    '?';
                  const hasWorkers =
                    workers.length > 0 &&
                    workers.some(
                      (w: any) => w.id && w.id !== '' && w.position && w.position !== ''
                    );
                  return (
                    <TextField
                      {...params}
                      label={hasWorkers ? 'Operator*' : 'Add workers first'}
                      placeholder={hasWorkers ? 'Search an operator' : 'No workers available'}
                      error={!!operatorError}
                      helperText={
                        operatorError ||
                        (!hasWorkers ? 'Please add workers before selecting an operator' : '')
                      }
                      FormHelperTextProps={{ sx: { minHeight: 24 } }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: selected ? (
                          <Avatar
                            src={selected.photo_url || ''}
                            sx={{
                              width: 26,
                              height: 26,
                              fontSize: 15,
                              bgcolor: (vehicleThemeInput) => {
                                const paletteColor = (vehicleThemeInput.palette as any)[
                                  getAvatarColor(selected)
                                ];
                                return paletteColor?.main || vehicleThemeInput.palette.grey[500];
                              },
                            }}
                          >
                            {!selected.photo_url && fallbackLetter}
                          </Avatar>
                        ) : null,
                      }}
                    />
                  );
                }}
              />
            );
          }}
        />

        <Controller
          name={fieldNames.type}
          control={control}
          render={({ field }) => (
            <Field.Select
              {...field}
              size="small"
              label={currentOperator?.id ? 'Vehicle Type*' : 'Select operator first'}
              FormHelperTextProps={{ sx: { minHeight: 24 } }}
              disabled={!currentOperator?.id}
              onChange={(event) => {
                field.onChange(event); // Update the form value
                // Reset vehicle when type changes
                setValue(fieldNames.id, '');
                setValue(fieldNames.license_plate, '');
                setValue(fieldNames.unit_number, '');
              }}
            >
              {JOB_VEHICLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>
          )}
        />

        {vehicleNumberField}

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveVehicleItem}
            sx={{ px: 4, mt: 1 }}
          >
            Remove
          </Button>
        )}
      </Box>
      {isXsSmMd && (
        <Button
          size="small"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={onRemoveVehicleItem}
        >
          Remove
        </Button>
      )}
    </Box>
  );
}

export const EquipmentItem = React.memo(function EquipmentItem({
  onRemoveEquipmentItem,
  fieldNames,
}: EquipmentItemProps) {
  const { watch } = useFormContext();
  const equipmentTheme = useTheme();
  const isXsSmMd = useMediaQuery(equipmentTheme.breakpoints.down('md'));
  const selectedEquipmentType = watch(fieldNames.type);

  const quantityDisabled = useMemo(() => !selectedEquipmentType, [selectedEquipmentType]);
  const quantityPlaceholder = useMemo(
    () => (quantityDisabled ? 'Select equipment first' : '0'),
    [quantityDisabled]
  );

  return (
    <Box
      sx={{
        gap: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
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
        <Field.Select
          size="small"
          name={fieldNames.type}
          label="Equipment Type*"
          FormHelperTextProps={{ sx: { minHeight: 24 } }}
        >
          {JOB_EQUIPMENT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text
          size="small"
          fullWidth
          type="number"
          name={fieldNames.quantity}
          label="Quantity*"
          placeholder={quantityPlaceholder}
          disabled={quantityDisabled}
          FormHelperTextProps={{ sx: { minHeight: 24 } }}
        />

        {!isXsSmMd && (
          <Button
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveEquipmentItem}
            sx={{ px: 4, mt: 1 }}
          >
            Remove
          </Button>
        )}
      </Box>
      {isXsSmMd && (
        <Button
          size="small"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={onRemoveEquipmentItem}
        >
          Remove
        </Button>
      )}
    </Box>
  );
});
