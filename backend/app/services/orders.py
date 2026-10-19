from typing import Any

from sqlalchemy import (
    ColumnElement,
    String,
    UnaryExpression,
    case,
    cast,
    exists,
    func,
    literal,
    literal_column,
    select,
)
from sqlalchemy.dialects.postgresql import aggregate_order_by
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.period import local_day_start_utc, local_range_utc, local_today
from app.models import Location, Order, OrderItem, OrderStatus, Product
from app.schemas.common import Page
from app.schemas.order import (
    OrderFilters,
    OrderItemRead,
    OrderListItem,
    OrderLocation,
    OrderRead,
    OrderSort,
    RecentOrder,
    RecentOrdersRead,
    TodayStats,
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


async def list_recent_orders(
    session: AsyncSession, location_id: int | None, limit: int
) -> RecentOrdersRead:
    """Live feed: newest orders of any status plus today's totals."""
    location_filter = [Order.location_id == location_id] if location_id is not None else []

    latest = (
        select(Order.id)
        .where(*location_filter)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(limit)
        .scalar_subquery()
    )
    line = Product.name + case(
        (OrderItem.quantity > 1, literal(" ×") + cast(OrderItem.quantity, String)), else_=""
    )
    summaries = (
        select(
            OrderItem.order_id,
            func.string_agg(line, aggregate_order_by(literal_column("', '"), OrderItem.id)).label(
                "items_summary"
            ),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .where(OrderItem.order_id.in_(latest))
        .group_by(OrderItem.order_id)
        .subquery()
    )
    rows = (
        await session.execute(
            select(Order, Location.name, summaries.c.items_summary)
            .join(Location, Location.id == Order.location_id)
            .join(summaries, summaries.c.order_id == Order.id)
            .order_by(Order.created_at.desc(), Order.id.desc())
        )
    ).all()

    today = local_today()
    start, end = local_range_utc(today, today)
    today_orders, today_revenue = (
        await session.execute(
            select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.created_at >= start,
                Order.created_at < end,
                Order.status != OrderStatus.cancelled,
                *location_filter,
            )
        )
    ).one()

    return RecentOrdersRead(
        items=[
            RecentOrder(
                id=order.id,
                number=order.number,
                created_at=order.created_at,
                status=order.status,
                total_amount=order.total_amount,
                location_id=order.location_id,
                location_name=location_name,
                items_summary=items_summary,
            )
            for order, location_name, items_summary in rows
        ],
        today=TodayStats(orders=int(today_orders), revenue=int(today_revenue)),
    )


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
