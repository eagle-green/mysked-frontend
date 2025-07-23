import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { PreferenceIndicators } from 'src/components/preference/preference-indicators';
import { EnhancedPreferenceIndicators } from 'src/components/preference/enhanced-preference-indicators';

// ----------------------------------------------------------------------

// Mock employee data with different preference scenarios
const mockEmployees = [
  {
    id: '1',
    name: 'John Smith',
    photo_url: null,
    preferences: [true, true, true], // Company + Site + Client preferred
    backgroundColor: 'success',
    type: 'Triple Preferred',
    enhancedPreferences: {
      company: { type: 'preferred', isMandatory: false },
      site: { type: 'preferred', isMandatory: false },
      client: { type: 'preferred', isMandatory: false },
    },
  },
  {
    id: '2', 
    name: 'Sarah Johnson',
    photo_url: null,
    preferences: [true, false, true], // Company + Client preferred
    backgroundColor: 'success',
    type: 'Double Preferred',
    enhancedPreferences: {
      company: { type: 'preferred', isMandatory: false },
      site: null,
      client: { type: 'preferred', isMandatory: false },
    },
  },
  {
    id: '3',
    name: 'Mike Wilson',
    photo_url: null,
    preferences: [true, false, false], // Company preferred only
    backgroundColor: 'success',
    type: 'Single Preferred',
    enhancedPreferences: {
      company: { type: 'preferred', isMandatory: false },
      site: null,
      client: null,
    },
  },
  {
    id: '4',
    name: 'Lisa Davis',
    photo_url: null,
    preferences: [false, false, false], // No preferences
    backgroundColor: 'default',
    type: 'Regular Employee',
    enhancedPreferences: {
      company: null,
      site: null,
      client: null,
    },
  },
  {
    id: '5',
    name: 'Tom Brown',
    photo_url: null,
    preferences: [false, false, false], // Not preferred (regular)
    backgroundColor: 'warning',
    type: 'Not Preferred (Regular)',
    isNotPreferred: true,
    enhancedPreferences: {
      company: { type: 'not_preferred', isMandatory: false, reason: 'Attendance issues' },
      site: null,
      client: { type: 'not_preferred', isMandatory: false, reason: 'Communication problems' },
    },
  },
  {
    id: '6',
    name: 'Anna Taylor',
    photo_url: null,
    preferences: [false, false, false], // Not preferred (mandatory) - hidden by default
    backgroundColor: 'error', 
    type: 'Not Preferred (Mandatory)',
    isMandatoryNotPreferred: true,
    enhancedPreferences: {
      company: { type: 'not_preferred', isMandatory: true, reason: 'Safety violation' },
      site: null,
      client: null,
    },
  },
];

export function JobWorkerDemo() {
  const [viewAllWorkers, setViewAllWorkers] = useState(false);

  // Filter employees based on viewAll setting
  const filteredEmployees = viewAllWorkers 
    ? mockEmployees 
    : mockEmployees.filter(emp => 
        // Hide anyone with mandatory restrictions, regardless of other preferences
        !emp.isMandatoryNotPreferred && (
          // Only show preferred users and regular users (no preferences)
          emp.type === 'Preferred Employee' || 
          emp.type === 'Regular Employee'
        )
      );



  return (
    <Card sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enhanced Preference Indicators: Up to 9 circles in 3 groups showing Preferred (green), Not Preferred (yellow), and Mandatory Restrictions (red) for Company|Site|Client
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filteredEmployees.map((emp) => (
          <Box
            key={emp.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {emp.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                ({emp.type})
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EnhancedPreferenceIndicators 
                preferences={emp.enhancedPreferences as any}
                size="medium" 
              />
            </Box>
          </Box>
        ))}
      </Box>

      {!viewAllWorkers && mockEmployees.some(emp => emp.isMandatoryNotPreferred) && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          * Some employees are hidden due to mandatory restrictions. Toggle "View All" to see them.
        </Typography>
      )}

      <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.neutral', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Color Coding:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'success.lighter', borderRadius: 1 }} />
            <Typography variant="body2">Preferred employees (shown first)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'transparent', border: 1, borderColor: 'divider', borderRadius: 1 }} />
            <Typography variant="body2">Regular employees (no preferences)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'warning.lighter', borderRadius: 1 }} />
            <Typography variant="body2">Not preferred (can proceed with warning)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'error.lighter', borderRadius: 1 }} />
            <Typography variant="body2">Mandatory restrictions (hidden by default)</Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

export default JobWorkerDemo; 