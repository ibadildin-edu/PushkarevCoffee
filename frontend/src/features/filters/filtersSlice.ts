import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../app/store';

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export interface FiltersState {
  period: Period;
  locationId: number | null;
  live: boolean;
}

export const initialFiltersState: FiltersState = {
  period: 7,
  locationId: null,
  live: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFiltersState,
  reducers: {
    filtersChanged(state, action: PayloadAction<Partial<FiltersState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { filtersChanged } = filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;

export const selectFilters = (state: RootState): FiltersState => state.filters;
