import { baseApi } from '../../api/baseApi';
import type { Order, OrderListItem, OrderSort, OrderStatus, Page } from '../../api/types';

export interface OrdersQueryArgs {
  page: number;
  page_size: number;
  sort?: OrderSort;
  status?: OrderStatus;
  location_id?: number;
  product_id?: number;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
}

const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<Page<OrderListItem>, OrdersQueryArgs>({
      // fetchBaseQuery drops undefined params.
      query: (params) => ({ url: '/orders', params }),
      providesTags: [{ type: 'Orders', id: 'LIST' }],
    }),
    getOrder: build.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderQuery } = ordersApi;
