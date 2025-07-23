import type { IUser } from 'src/types/user';
import type { IEnhancedEmployee, IWorkerWarningDialog } from 'src/types/preference';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fetcher, endpoints } from 'src/lib/axios';

import { PreferenceIndicators } from 'src/components/preference/preference-indicators';

// ----------------------------------------------------------------------

interface WorkerSelectionProps {
  currentWorkerIndex: number;
  employeeOptions: any[];
  onEmployeeSelect: (employee: IEnhancedEmployee | null) => void;
  selectedEmployeeId?: string;
}

export function WorkerSelection({
  currentWorkerIndex,
  employeeOptions,
  onEmployeeSelect,
  selectedEmployeeId,
}: WorkerSelectionProps) {
  const { getValues } = useFormContext();
  const [viewAllWorkers, setViewAllWorkers] = useState(false);
  const [workerWarning, setWorkerWarning] = useState<IWorkerWarningDialog>({
    open: false,
    employee: { name: '', id: '' },
    warningType: 'not_preferred',
    reasons: [],
    isMandatory: false,
    canProceed: true,
  });

  // Get current company, site, and client IDs for preference fetching
  const currentCompany = getValues('company');
  const currentSite = getValues('site');
  const currentClient = getValues('client');

  // Fetch preferences for filtering
  const { data: companyPreferences = [] } = useQuery({
    queryKey: ['company-preferences', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const response = await fetcher(`${endpoints.companyPreferences}?company_id=${currentCompany.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentCompany?.id,
  });

  const { data: sitePreferences = [] } = useQuery({
    queryKey: ['site-preferences', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const response = await fetcher(`${endpoints.sitePreference}?site_id=${currentSite.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentSite?.id,
  });

  const { data: clientPreferences = [] } = useQuery({
    queryKey: ['client-preferences', currentClient?.id],
    queryFn: async () => {
      if (!currentClient?.id) return [];
      const response = await fetcher(`${endpoints.clientPreferences}?client_id=${currentClient.id}`);
      return response.data.preferences || [];
    },
    enabled: !!currentClient?.id,
  });

  // Enhanced employee options with preference metadata
  const enhancedEmployeeOptions = useMemo(() => {
    return employeeOptions.map((emp) => {
      // Find preferences for this employee
      const companyPref = companyPreferences.find((p: any) => 
        (p.employee?.id === emp.value || p.user?.id === emp.value)
      );
      const sitePref = sitePreferences.find((p: any) => 
        (p.employee?.id === emp.value || p.user?.id === emp.value)
      );
      const clientPref = clientPreferences.find((p: any) => 
        (p.employee?.id === emp.value || p.user?.id === emp.value)
      );

      // Build preference metadata
      const preferences = {
        company: companyPref ? {
          type: companyPref.preference_type,
          isMandatory: companyPref.is_mandatory || false,
          reason: companyPref.reason,
        } : null,
        site: sitePref ? {
          type: sitePref.preference_type,
          isMandatory: sitePref.is_mandatory || false,
          reason: sitePref.reason,
        } : null,
        client: clientPref ? {
          type: clientPref.preference_type,
          isMandatory: clientPref.is_mandatory || false,
          reason: clientPref.reason,
        } : null,
      };

      // Calculate metadata
      const hasMandatoryNotPreferred = 
        (preferences.company?.type === 'not_preferred' && preferences.company.isMandatory) ||
        (preferences.site?.type === 'not_preferred' && preferences.site.isMandatory) ||
        (preferences.client?.type === 'not_preferred' && preferences.client.isMandatory);

      const hasNotPreferred = 
        (preferences.company?.type === 'not_preferred' && !preferences.company.isMandatory) ||
        (preferences.site?.type === 'not_preferred' && !preferences.site.isMandatory) ||
        (preferences.client?.type === 'not_preferred' && !preferences.client.isMandatory);

      const preferredCount = [
        preferences.company?.type === 'preferred',
        preferences.site?.type === 'preferred',
        preferences.client?.type === 'preferred',
      ].filter(Boolean).length;

      const preferenceIndicators: [boolean, boolean, boolean] = [
        preferences.company?.type === 'preferred',
        preferences.site?.type === 'preferred',
        preferences.client?.type === 'preferred',
      ];

      // Determine background color
      let backgroundColor: 'success' | 'warning' | 'error' | 'default' = 'default';
      if (preferredCount > 0) {
        backgroundColor = 'success';
      } else if (hasMandatoryNotPreferred) {
        backgroundColor = 'error';
      } else if (hasNotPreferred) {
        backgroundColor = 'warning';
      }

      return {
        ...emp,
        preferences,
        hasMandatoryNotPreferred,
        hasNotPreferred,
        hasPreferred: preferredCount > 0,
        preferredCount,
        preferenceIndicators,
        backgroundColor,
        sortPriority: hasMandatoryNotPreferred ? 1000 : 
                     hasNotPreferred ? 500 : 
                     preferredCount > 0 ? -preferredCount : 
                     0,
      };
    }).sort((a: any, b: any) => a.sortPriority - b.sortPriority);
  }, [employeeOptions, companyPreferences, sitePreferences, clientPreferences]);

  // Filter options based on viewAll setting
  const filteredOptions = useMemo(() => {
    if (viewAllWorkers) {
      return enhancedEmployeeOptions;
    }
    // Hide mandatory not-preferred by default
    return enhancedEmployeeOptions.filter(emp => !emp.hasMandatoryNotPreferred);
  }, [enhancedEmployeeOptions, viewAllWorkers]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled' }}>
          Workers:
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={viewAllWorkers}
              onChange={(e) => setViewAllWorkers(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              View All
            </Typography>
          }
        />
      </Box>

      {/* Display employee options with preference indicators */}
      <Box>
        {filteredOptions.map((emp) => (
          <Box
            key={emp.value}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              backgroundColor: emp.backgroundColor === 'success' ? 'success.lighter' :
                             emp.backgroundColor === 'warning' ? 'warning.lighter' :
                             emp.backgroundColor === 'error' ? 'error.lighter' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Typography variant="body2">{emp.label}</Typography>
            <PreferenceIndicators indicators={emp.preferenceIndicators} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default WorkerSelection; 