import { baseApi } from '../../api/baseApi';
import type { Location, LocationWithKpi } from '../../api/types';

const locationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLocations: build.query<LocationWithKpi[], void>({
      query: () => '/locations',
      providesTags: (result) => [
        { type: 'Locations', id: 'LIST' },
        ...(result ?? []).map(({ id }) => ({ type: 'Locations' as const, id })),
      ],
    }),
    getLocation: build.query<Location, number>({
      query: (id) => `/locations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Locations', id }],
    }),
  }),
});

export const { useGetLocationsQuery, useGetLocationQuery } = locationsApi;
