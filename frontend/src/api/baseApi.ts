import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Features add their endpoints with baseApi.injectEndpoints.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Products', 'Orders', 'Locations', 'Analytics'],
  endpoints: () => ({}),
});
