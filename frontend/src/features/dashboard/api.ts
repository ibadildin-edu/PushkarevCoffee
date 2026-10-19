import { baseApi } from '../../api/baseApi';
import type {
  CategoryShares,
  Heatmap,
  Kpi,
  LocationComparison,
  RevenueDaily,
  SimulatorState,
  TopProduct,
} from '../../api/types';

export interface AnalyticsArgs {
  date_from: string;
  date_to: string;
  location_id?: number;
}

const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getKpi: build.query<Kpi, AnalyticsArgs>({
      query: (params) => ({ url: '/analytics/kpi', params }),
      providesTags: ['Analytics'],
    }),
    getRevenueDaily: build.query<RevenueDaily, AnalyticsArgs>({
      query: (params) => ({ url: '/analytics/revenue-daily', params }),
      providesTags: ['Analytics'],
    }),
    getTopProducts: build.query<TopProduct[], AnalyticsArgs & { limit?: number }>({
      query: (params) => ({ url: '/analytics/top-products', params }),
      providesTags: ['Analytics'],
    }),
    getHeatmap: build.query<Heatmap, AnalyticsArgs>({
      query: (params) => ({ url: '/analytics/heatmap', params }),
      providesTags: ['Analytics'],
    }),
    getCategoryShares: build.query<CategoryShares, AnalyticsArgs>({
      query: (params) => ({ url: '/analytics/categories', params }),
      providesTags: ['Analytics'],
    }),
    getLocationsComparison: build.query<LocationComparison[], Omit<AnalyticsArgs, 'location_id'>>({
      query: (params) => ({ url: '/analytics/locations-comparison', params }),
      providesTags: ['Analytics'],
    }),
    setSimulator: build.mutation<SimulatorState, SimulatorState>({
      query: (body) => ({ url: '/simulator', method: 'PUT', body }),
    }),
  }),
});

export const {
  useGetKpiQuery,
  useGetRevenueDailyQuery,
  useGetTopProductsQuery,
  useGetHeatmapQuery,
  useGetCategorySharesQuery,
  useGetLocationsComparisonQuery,
  useSetSimulatorMutation,
} = analyticsApi;
