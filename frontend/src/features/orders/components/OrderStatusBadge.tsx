import type { OrderStatus } from '../../../api/types';
import { Badge } from '../../../shared/ui/Badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '../statuses';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
