import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export interface ComparisonState {
  enabled: boolean;
  type: 'month' | 'quarter' | 'year';
  baselinePeriod: string;
}

export interface FilterState {
  dateRange: string;
  client: string;
  channel: string;
  language: string;
  teamMember: string;
  inputType: string;
  outputType: string;
  comparison: ComparisonState;
}

export interface FilterContextValue {
  filters: FilterState;
  updateFilters: (partial: Partial<Omit<FilterState, 'comparison'>>) => void;
  updateComparison: (partial: Partial<ComparisonState>) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const DEFAULT_FILTERS: FilterState = {
  dateRange: 'last_30d',
  client: 'all',
  channel: 'all',
  language: 'all',
  teamMember: 'all',
  inputType: 'all',
  outputType: 'all',
  comparison: {
    enabled: false,
    type: 'month',
    baselinePeriod: 'prev',
  },
};

const FilterContext = createContext<FilterContextValue | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const updateFilters = useCallback((partial: Partial<Omit<FilterState, 'comparison'>>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateComparison = useCallback((partial: Partial<ComparisonState>) => {
    setFilters((prev) => ({
      ...prev,
      comparison: { ...prev.comparison, ...partial },
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.client !== 'all') count++;
    if (filters.channel !== 'all') count++;
    if (filters.language !== 'all') count++;
    if (filters.teamMember !== 'all') count++;
    if (filters.inputType !== 'all') count++;
    if (filters.outputType !== 'all') count++;
    if (filters.dateRange !== 'last_30d') count++;
    return count;
  }, [filters]);

  return (
    <FilterContext.Provider value={{ filters, updateFilters, updateComparison, resetFilters, activeFilterCount }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextValue => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
};
