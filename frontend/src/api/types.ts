// Mirrors backend/app/schemas. Money is whole tenge, datetimes are ISO strings in UTC,
// calendar dates are 'YYYY-MM-DD' (Asia/Almaty).

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  color: string;
}

export interface CategoryShort {
  id: number;
  name: string;
  color: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  category_id: number;
  category: CategoryShort;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  name: string;
  slug: string;
  address: string;
  opened_at: string;
  is_active: boolean;
}

export interface LocationKpi {
  revenue: number;
  orders: number;
  avg_check: number;
}

export interface LocationWithKpi extends Location {
  kpi_30d: LocationKpi;
}

export const ORDER_STATUSES = ['preparing', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderSort =
  'created_at' | '-created_at' | 'total_amount' | '-total_amount' | 'number' | '-number';

export interface OrderListItem {
  id: number;
  number: number;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  items_count: number;
  location_id: number;
  location_name: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  number: number;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  items_count: number;
  location: { id: number; name: string };
  items: OrderItem[];
}
