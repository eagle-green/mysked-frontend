import type { IJobTableFilters } from 'src/types/job';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<IJobTableFilters>;
  onResetFilters: () => void;
};

export function AdminFlraTableFiltersResult({ filters, onResetFilters, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    updateFilters({ query: '' });
  }, [updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    updateFilters({ status: 'all' });
  }, [updateFilters]);

  const handleRemoveClient = useCallback((clientToRemove: string) => {
    const updatedClients = currentFilters.client.filter((client: string) => client !== clientToRemove);
    updateFilters({ client: updatedClients });
  }, [updateFilters, currentFilters.client]);

  const handleRemoveCompany = useCallback((companyToRemove: string) => {
    const updatedCompanies = currentFilters.company.filter((company: string) => company !== companyToRemove);
    updateFilters({ company: updatedCompanies });
  }, [updateFilters, currentFilters.company]);

  const handleRemoveSite = useCallback((siteToRemove: string) => {
    const updatedSites = currentFilters.site.filter((site: string) => site !== siteToRemove);
    updateFilters({ site: updatedSites });
  }, [updateFilters, currentFilters.site]);

  const handleRemoveStartDate = useCallback(() => {
    updateFilters({ startDate: null });
  }, [updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    updateFilters({ endDate: null });
  }, [updateFilters]);

  const handleReset = useCallback(() => {
    onResetFilters();
  }, [onResetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip 
          {...chipProps} 
          label={currentFilters.status} 
          onDelete={handleRemoveStatus} 
        />
      </FiltersBlock>

      <FiltersBlock label="Company:" isShow={currentFilters.company.length > 0}>
        {currentFilters.company.map((company: string) => (
          <Chip
            key={company}
            {...chipProps}
            label={company}
            onDelete={() => handleRemoveCompany(company)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Site:" isShow={currentFilters.site.length > 0}>
        {currentFilters.site.map((site: string) => (
          <Chip
            key={site}
            {...chipProps}
            label={site}
            onDelete={() => handleRemoveSite(site)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Client:" isShow={currentFilters.client.length > 0}>
        {currentFilters.client.map((client: string) => (
          <Chip
            key={client}
            {...chipProps}
            label={client}
            onDelete={() => handleRemoveClient(client)}
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
