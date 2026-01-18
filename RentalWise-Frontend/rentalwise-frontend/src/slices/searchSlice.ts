// src/store/searchSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SearchFilters {
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

const defaultFilters: SearchFilters = {
  keyword: "",
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
  sortBy: "latest",
};

const searchSlice = createSlice({
  name: "search",
  initialState: defaultFilters,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      return { ...state, ...action.payload };
    },
    resetFilters: () => defaultFilters,
    setAllFilters: (_state, action: PayloadAction<SearchFilters>) => {
      return { ...action.payload }; // overwrite everything (for URL hydration)
    },
  },
});

export const { setFilters, resetFilters, setAllFilters } = searchSlice.actions;
export default searchSlice.reducer;
