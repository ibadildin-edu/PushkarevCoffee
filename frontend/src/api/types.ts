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

export interface RecentOrder {
  id: number;
  number: number;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  location_id: number;
  location_name: string;
  items_summary: string;
}

export interface RecentOrders {
  items: RecentOrder[];
  today: { orders: number; revenue: number };
}

export interface ProductCreate {
  name: string;
  category_id: number;
  price: number;
  is_active: boolean;
}

export type ProductUpdate = Partial<ProductCreate>;

export interface SimulatorState {
  enabled: boolean;
}

// Analytics. Percentages are in percent (2.5 = 2,5 %); delta is null without previous data.

export interface Metric {
  value: number;
  prev: number;
  delta_pct: number | null;
}

export interface BestProduct {
  product_id: number;
  name: string;
  quantity: number;
  share: number;
  prev: number;
  delta_pct: number | null;
}

export interface Kpi {
  revenue: Metric;
  orders: Metric;
  avg_check: Metric;
  best_product: BestProduct | null;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
  prev_revenue: number;
}

export interface RevenueDaily {
  points: RevenuePoint[];
  avg: number;
  max: { date: string; value: number } | null;
  prev_date_from: string;
  prev_date_to: string;
}

export interface TopProduct {
  product_id: number;
  name: string;
  category: string;
  category_color: string;
  quantity: number;
  revenue: number;
}

export interface HeatmapCell {
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  hour: number;
  avg_orders: number;
}

export interface Heatmap {
  cells: HeatmapCell[];
  peak: HeatmapCell | null;
}

export interface CategoryShare {
  category_id: number;
  name: string;
  color: string;
  quantity: number;
  revenue: number;
  share: number;
}

export interface CategoryShares {
  items: CategoryShare[];
  total_quantity: number;
}

export interface LocationComparison {
  location_id: number;
  name: string;
  revenue: number;
  orders: number;
  avg_check: number;
  delta_pct: number | null;
}
