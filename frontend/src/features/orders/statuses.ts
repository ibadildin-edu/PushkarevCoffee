import type { OrderStatus } from '../../api/types';
import type { BadgeTone } from '../../shared/ui/Badge';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  preparing: 'Готовится',
  completed: 'Выдан',
  cancelled: 'Отменён',
};

export const ORDER_STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  preparing: 'warning',
  completed: 'success',
  cancelled: 'danger',
};
