// src/context/SearchContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SearchFilters {
  keyword?: string;
  regionId?: number | null;
  districtId?: number | null;
  suburbIds?: number[];
  propertyTypes?: number[];
  propertyFeatures?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  minRent?: number | null;
  maxRent?: number | null;
  petsAllowed?: boolean | null;
  moveInDate?: string | null;
  page?: number;
  pageSize: number;
  regionName?: string | null;
  districtName?: string | null;
  suburbNames?: string[] | null;
  sortBy?: string;
}

interface SearchContextType {
  filters: SearchFilters;
  setFilters: (updates: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  keyword: '',
  regionId: null,
  districtId: null,
  suburbIds: [],
  propertyTypes: [],
  propertyFeatures: null,
  bedrooms: null,
  bathrooms: null,
  parkingSpaces: null,
  minRent: null,
  maxRent: null,
  petsAllowed: null,
  moveInDate: null,
  page: 1,
  pageSize: 10,
  regionName: null,
  districtName: null,
  suburbNames: null,
  sortBy: 'latest',
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

function parseQueryParams(queryString: string): Partial<SearchFilters> {  //takes the query string (location.search) and turns it into your filter state
  const params = new URLSearchParams(queryString);
  const getNum = (key: string) => {
    const val = params.get(key);
    return val !== null ? +val : null;
  };

  return {
    keyword: params.get('keyword') || '',
    regionId: getNum('regionId'),
    districtId: getNum('districtId'),
    suburbIds: params.get('suburbIds')?.split(',').map(Number) || [],
    propertyTypes: params.get('propertyTypes')?.split(',').map(Number) || [],
    propertyFeatures: getNum('propertyFeatures'),
    bedrooms: getNum('bedrooms'),
    bathrooms: getNum('bathrooms'),
    parkingSpaces: getNum('parkingSpaces'),
    minRent: getNum('minRent'),
    maxRent: getNum('maxRent'),
    petsAllowed: params.get('petsAllowed') === 'true' ? true : params.get('petsAllowed') === 'false' ? false : null,
    moveInDate: params.get('moveInDate') || null,
    page: getNum('page') ?? 1,
    pageSize: getNum('pageSize') ?? 10,
    sortBy: params.get('sortBy') || 'latest',
    // Parse names
    regionName: params.get('regionName') || null,
    districtName: params.get('districtName') || null,
    suburbNames: params.get('suburbNames') ? params.get('suburbNames')!.split(',') : null,
  };
}

function serializeFilters(filters: Partial<SearchFilters>): string {  // takes your filter object and turns it into a URL query string
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value.toString());
      }
    }
  });

  return params.toString();
}

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilterState] = useState<SearchFilters>({
    ...defaultFilters,
    ...parseQueryParams(location.search),
  });

  const setFilters = (updates: Partial<SearchFilters>) => {
    const updated = { ...filters, ...updates };
    setFilterState(updated);

    const query = serializeFilters(updated);
    navigate({ pathname: location.pathname, search: `?${query}` }, { replace: true });
  };

  const resetFilters = () => {
    setFilterState(defaultFilters);
    navigate({ pathname: location.pathname }, { replace: true });
  };

  // On first load, sync from URL → state
  useEffect(() => {
    setFilterState((prev) => ({ ...prev, ...parseQueryParams(location.search) }));
  }, [location.search]);

  return (
    <SearchContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within a SearchProvider');
  return context;
};
