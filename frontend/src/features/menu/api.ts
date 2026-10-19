import { baseApi } from '../../api/baseApi';
import type { Category, Product } from '../../api/types';

export interface ProductsQueryArgs {
  category_id?: number;
  is_active?: boolean;
  search?: string;
}

const menuApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => '/categories',
    }),
    getProducts: build.query<Product[], ProductsQueryArgs>({
      query: (params) => ({ url: '/products', params }),
      providesTags: (result) => [
        { type: 'Products', id: 'LIST' },
        ...(result ?? []).map(({ id }) => ({ type: 'Products' as const, id })),
      ],
    }),
  }),
});

export const { useGetCategoriesQuery, useGetProductsQuery } = menuApi;
