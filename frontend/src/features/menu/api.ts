import { baseApi } from '../../api/baseApi';
import type { Category, Product, ProductCreate, ProductUpdate } from '../../api/types';

export interface ProductsQueryArgs {
  category_id?: number;
  is_active?: boolean;
  search?: string;
}

// A product change affects menu lists, order details (names) and analytics.
const productChanged = (id?: number) => [
  { type: 'Products' as const, id: 'LIST' },
  ...(id === undefined ? [] : [{ type: 'Products' as const, id }]),
  'Orders' as const,
  'Analytics' as const,
];

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
    createProduct: build.mutation<Product, ProductCreate>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: () => productChanged(),
    }),
    updateProduct: build.mutation<Product, { id: number; changes: ProductUpdate }>({
      query: ({ id, changes }) => ({ url: `/products/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: (_result, _error, { id }) => productChanged(id),
    }),
    /** Soft delete: the backend sets is_active = false. */
    deactivateProduct: build.mutation<Product, number>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => productChanged(id),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeactivateProductMutation,
} = menuApi;
