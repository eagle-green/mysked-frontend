import type { IJobTableFilters } from 'src/types/job';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
  onFilters: (name: string, value: any) => void;
  onResetFilters: () => void;
};



export function AdminTimesheetTableFiltersResult({ filters, onFilters, onResetFilters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveClient = useCallback((clientToRemove: string) => {
    onResetPage();
    const updatedClients = currentFilters.client.filter((client) => client.id !== clientToRemove);
    updateFilters({ client: updatedClients });
  }, [onResetPage, updateFilters, currentFilters.client]);

  const handleRemoveCompany = useCallback((companyToRemove: string) => {
    onResetPage();
    const updatedCompanies = currentFilters.company.filter((company) => company.id !== companyToRemove);
    updateFilters({ company: updatedCompanies });
  }, [onResetPage, updateFilters, currentFilters.company]);

  const handleRemoveSite = useCallback((siteToRemove: string) => {
    onResetPage();
    const updatedSites = currentFilters.site.filter((site) => site.id !== siteToRemove);
    updateFilters({ site: updatedSites });
  }, [onResetPage, updateFilters, currentFilters.site]);

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    onResetFilters();
  }, [onResetPage, onResetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>




      <FiltersBlock label="Company:" isShow={currentFilters.company.length > 0}>
        {currentFilters.company.map((company) => (
          <Chip
            key={company.id}
            {...chipProps}
            label={company.name}
            onDelete={() => handleRemoveCompany(company.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Site:" isShow={currentFilters.site.length > 0}>
        {currentFilters.site.map((site) => (
          <Chip
            key={site.id}
            {...chipProps}
            label={site.name}
            onDelete={() => handleRemoveSite(site.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Client:" isShow={currentFilters.client.length > 0}>
        {currentFilters.client.map((client) => (
          <Chip
            key={client.id}
            {...chipProps}
            label={client.name}
            onDelete={() => handleRemoveClient(client.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Date:" isShow={!!currentFilters.startDate || !!currentFilters.endDate}>
        {(() => {
          const startDate = currentFilters.startDate;
          const endDate = currentFilters.endDate;
          
          if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            
            if (start.isSame(end, 'day')) {
              // Same date: "Date: 07 Aug 2025"
              return (
                <Chip 
                  {...chipProps} 
                  label={`${start.format('DD MMM YYYY')}`} 
                  onDelete={() => {
                    handleRemoveStartDate();
                    handleRemoveEndDate();
                  }} 
                />
              );
            } else {
              // Different dates: "Date: 07 - 08 Aug 2025"
              const startDay = start.format('DD');
              const endDay = end.format('DD');
              const monthYear = end.format('MMM YYYY');
              
              return (
                <Chip 
                  {...chipProps} 
                  label={`${startDay} - ${endDay} ${monthYear}`} 
                  onDelete={() => {
                    handleRemoveStartDate();
                    handleRemoveEndDate();
                  }} 
                />
              );
            }
          } else if (startDate) {
            // Only start date
            return (
              <Chip 
                {...chipProps} 
                label={dayjs(startDate).format('DD MMM YYYY')} 
                onDelete={handleRemoveStartDate} 
              />
            );
          } else if (endDate) {
            // Only end date
            return (
              <Chip 
                {...chipProps} 
                label={dayjs(endDate).format('DD MMM YYYY')} 
                onDelete={handleRemoveEndDate} 
              />
            );
          }
          return null;
        })()}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
} 