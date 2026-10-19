from typing import Any

from sqlalchemy import ColumnElement, UnaryExpression, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.period import local_day_start_utc, local_range_utc
from app.models import Location, Order, OrderItem
from app.schemas.common import Page
from app.schemas.order import (
    OrderFilters,
    OrderItemRead,
    OrderListItem,
    OrderLocation,
    OrderRead,
    OrderSort,
)
from app.services.errors import NotFoundError

SORT_COLUMNS: dict[OrderSort, UnaryExpression[Any]] = {
    OrderSort.created_at_asc: Order.created_at.asc(),
    OrderSort.created_at_desc: Order.created_at.desc(),
    OrderSort.total_asc: Order.total_amount.asc(),
    OrderSort.total_desc: Order.total_amount.desc(),
    OrderSort.number_asc: Order.number.asc(),
    OrderSort.number_desc: Order.number.desc(),
}


def _filter_conditions(filters: OrderFilters) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = []
    if filters.date_from and filters.date_to:
        start, end = local_range_utc(filters.date_from, filters.date_to)
        conditions += [Order.created_at >= start, Order.created_at < end]
    elif filters.date_from:
        conditions.append(Order.created_at >= local_day_start_utc(filters.date_from))
    elif filters.date_to:
        _, end = local_range_utc(filters.date_to, filters.date_to)
        conditions.append(Order.created_at < end)
    if filters.location_id is not None:
        conditions.append(Order.location_id == filters.location_id)
    if filters.status is not None:
        conditions.append(Order.status == filters.status)
    if filters.product_id is not None:
        conditions.append(
            exists().where(
                OrderItem.order_id == Order.id, OrderItem.product_id == filters.product_id
            )
        )
    if filters.min_total is not None:
        conditions.append(Order.total_amount >= filters.min_total)
    if filters.max_total is not None:
        conditions.append(Order.total_amount <= filters.max_total)
    return conditions


async def list_orders(session: AsyncSession, filters: OrderFilters) -> Page[OrderListItem]:
    conditions = _filter_conditions(filters)

    total = await session.scalar(select(func.count(Order.id)).where(*conditions)) or 0

    stmt = (
        select(Order, Location.name)
        .join(Location, Location.id == Order.location_id)
        .where(*conditions)
        # Secondary key keeps pagination stable when the primary key has ties.
        .order_by(SORT_COLUMNS[filters.sort], Order.id.desc())
        .offset((filters.page - 1) * filters.page_size)
        .limit(filters.page_size)
    )
    rows = (await session.execute(stmt)).all()
    items = [
        OrderListItem(
            id=order.id,
            number=order.number,
            created_at=order.created_at,
            status=order.status,
            total_amount=order.total_amount,
            items_count=order.items_count,
            location_id=order.location_id,
            location_name=location_name,
        )
        for order, location_name in rows
    ]
    return Page(items=items, total=total, page=filters.page, page_size=filters.page_size)


async def get_order(session: AsyncSession, order_id: int) -> OrderRead:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.location),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
    )
    order = await session.scalar(stmt)
    if order is None:
        raise NotFoundError(f"Order {order_id} not found")
    return OrderRead(
        id=order.id,
        number=order.number,
        created_at=order.created_at,
        status=order.status,
        total_amount=order.total_amount,
        items_count=order.items_count,
        location=OrderLocation.model_validate(order.location),
        items=[
            OrderItemRead(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in sorted(order.items, key=lambda i: i.id)
        ],
    )
