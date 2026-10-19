"""Dashboard aggregations. Everything is aggregated in Postgres; Python only shapes rows.

Days and hours are taken in Asia/Almaty (`created_at AT TIME ZONE ...`), while range
filters stay on the raw UTC `created_at` so the indexes are used. Cancelled orders are
excluded everywhere.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy import ColumnElement, Date, Integer, cast, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.period import local_range_utc, local_time, previous_range
from app.models import Category, Location, Order, OrderItem, OrderStatus, Product
from app.schemas.analytics import (
    AnalyticsFilters,
    BestProduct,
    CategoriesRead,
    CategoryShare,
    DayValue,
    HeatmapCell,
    HeatmapRead,
    KpiRead,
    LocationComparison,
    Metric,
    RevenueDailyRead,
    RevenuePoint,
    TopProduct,
    TopProductsFilters,
)

# Opening hours shown on the heatmap (last order hour is 22:00-22:59).
HEATMAP_HOURS = range(7, 23)


@dataclass(frozen=True)
class Periods:
    """UTC bounds. The previous period is [prev_start, cur_start), the current [cur_start, end)."""

    prev_start: datetime
    cur_start: datetime
    end: datetime
    prev_from: date
    prev_to: date


def _periods(filters: AnalyticsFilters) -> Periods:
    prev_from, prev_to = previous_range(filters.date_from, filters.date_to)
    cur_start, end = local_range_utc(filters.date_from, filters.date_to)
    prev_start, _ = local_range_utc(prev_from, prev_to)
    return Periods(prev_start, cur_start, end, prev_from, prev_to)


def _conditions(
    start: datetime, end: datetime, location_id: int | None
) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = [
        Order.created_at >= start,
        Order.created_at < end,
        Order.status != OrderStatus.cancelled,
    ]
    if location_id is not None:
        conditions.append(Order.location_id == location_id)
    return conditions


def delta_pct(value: int, prev: int) -> float | None:
    if prev == 0:
        return None
    return round((value - prev) / prev * 100, 1)


def _avg_check(revenue: int, orders: int) -> int:
    return round(revenue / orders) if orders else 0


def _share(part: int, total: int) -> float:
    return round(part / total * 100, 1) if total else 0.0


def _metric(value: int, prev: int) -> Metric:
    return Metric(value=value, prev=prev, delta_pct=delta_pct(value, prev))


async def get_kpi(session: AsyncSession, filters: AnalyticsFilters) -> KpiRead:
    p = _periods(filters)
    in_current = Order.created_at >= p.cur_start
    both_periods = _conditions(p.prev_start, p.end, filters.location_id)

    totals = (
        await session.execute(
            select(
                func.coalesce(func.sum(Order.total_amount).filter(in_current), 0),
                func.count(Order.id).filter(in_current),
                func.coalesce(func.sum(Order.total_amount).filter(~in_current), 0),
                func.count(Order.id).filter(~in_current),
            ).where(*both_periods)
        )
    ).one()
    revenue, orders, prev_revenue, prev_orders = (int(v) for v in totals)

    qty_current = func.coalesce(func.sum(OrderItem.quantity).filter(in_current), 0)
    qty_prev = func.coalesce(func.sum(OrderItem.quantity).filter(~in_current), 0)
    revenue_current = func.coalesce(func.sum(OrderItem.line_total).filter(in_current), 0)
    best = (
        await session.execute(
            select(
                Product.id,
                Product.name,
                qty_current,
                qty_prev,
                # Window over the grouped rows: all items sold in the current period.
                func.sum(qty_current).over(),
            )
            .select_from(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .join(Product, Product.id == OrderItem.product_id)
            .where(*both_periods)
            .group_by(Product.id, Product.name)
            .having(qty_current > 0)
            .order_by(qty_current.desc(), revenue_current.desc(), Product.name)
            .limit(1)
        )
    ).first()

    best_product = None
    if best is not None:
        product_id, name, quantity, prev_quantity, total_quantity = best
        best_product = BestProduct(
            product_id=product_id,
            name=name,
            quantity=int(quantity),
            share=_share(int(quantity), int(total_quantity)),
            prev=int(prev_quantity),
            delta_pct=delta_pct(int(quantity), int(prev_quantity)),
        )

    return KpiRead(
        revenue=_metric(revenue, prev_revenue),
        orders=_metric(orders, prev_orders),
        avg_check=_metric(_avg_check(revenue, orders), _avg_check(prev_revenue, prev_orders)),
        best_product=best_product,
    )


async def get_revenue_daily(session: AsyncSession, filters: AnalyticsFilters) -> RevenueDailyRead:
    p = _periods(filters)
    local_day = cast(local_time(Order.created_at), Date)
    rows = (
        await session.execute(
            select(local_day, func.sum(Order.total_amount), func.count(Order.id))
            .where(*_conditions(p.prev_start, p.end, filters.location_id))
            .group_by(local_day)
        )
    ).all()
    by_day: dict[date, tuple[int, int]] = {day: (int(rev), int(cnt)) for day, rev, cnt in rows}

    days = filters.days
    points: list[RevenuePoint] = []
    for index in range(days):
        day = filters.date_from + timedelta(days=index)
        revenue, orders = by_day.get(day, (0, 0))
        prev_revenue, _ = by_day.get(day - timedelta(days=days), (0, 0))
        points.append(
            RevenuePoint(date=day, revenue=revenue, orders=orders, prev_revenue=prev_revenue)
        )

    peak = max(points, key=lambda point: point.revenue)
    return RevenueDailyRead(
        points=points,
        avg=round(sum(point.revenue for point in points) / days),
        max=DayValue(date=peak.date, value=peak.revenue) if peak.revenue > 0 else None,
        prev_date_from=p.prev_from,
        prev_date_to=p.prev_to,
    )


async def get_top_products(session: AsyncSession, filters: TopProductsFilters) -> list[TopProduct]:
    start, end = local_range_utc(filters.date_from, filters.date_to)
    quantity = func.sum(OrderItem.quantity)
    revenue = func.sum(OrderItem.line_total)
    rows = (
        await session.execute(
            select(Product.id, Product.name, Category.name, Category.color, quantity, revenue)
            .select_from(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .where(*_conditions(start, end, filters.location_id))
            .group_by(Product.id, Product.name, Category.name, Category.color)
            .order_by(quantity.desc(), revenue.desc(), Product.name)
            .limit(filters.limit)
        )
    ).all()
    return [
        TopProduct(
            product_id=product_id,
            name=name,
            category=category,
            category_color=color,
            quantity=int(qty),
            revenue=int(rev),
        )
        for product_id, name, category, color, qty, rev in rows
    ]


async def get_heatmap(session: AsyncSession, filters: AnalyticsFilters) -> HeatmapRead:
    start, end = local_range_utc(filters.date_from, filters.date_to)
    local = local_time(Order.created_at)
    weekday = cast(extract("isodow", local), Integer)
    hour = cast(extract("hour", local), Integer)
    rows = (
        await session.execute(
            select(weekday, hour, func.count(Order.id))
            .where(*_conditions(start, end, filters.location_id))
            .group_by(weekday, hour)
        )
    ).all()
    counts: dict[tuple[int, int], int] = {(wd, hr): int(cnt) for wd, hr, cnt in rows}

    # How many Mondays, Tuesdays, ... the period contains (calendar math, not order rows).
    occurrences = dict.fromkeys(range(1, 8), 0)
    for index in range(filters.days):
        occurrences[(filters.date_from + timedelta(days=index)).isoweekday()] += 1

    cells = [
        HeatmapCell(
            weekday=wd,
            hour=hr,
            avg_orders=round(counts.get((wd, hr), 0) / occurrences[wd], 1)
            if occurrences[wd]
            else 0.0,
        )
        for wd in range(1, 8)
        for hr in HEATMAP_HOURS
    ]
    peak = max(cells, key=lambda cell: cell.avg_orders)
    return HeatmapRead(cells=cells, peak=peak if peak.avg_orders > 0 else None)


async def get_categories(session: AsyncSession, filters: AnalyticsFilters) -> CategoriesRead:
    start, end = local_range_utc(filters.date_from, filters.date_to)
    sold = (
        select(
            Product.category_id,
            func.sum(OrderItem.quantity).label("quantity"),
            func.sum(OrderItem.line_total).label("revenue"),
        )
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
        .where(*_conditions(start, end, filters.location_id))
        .group_by(Product.category_id)
        .subquery()
    )
    quantity = func.coalesce(sold.c.quantity, 0)
    rows = (
        await session.execute(
            select(
                Category.id,
                Category.name,
                Category.color,
                quantity,
                func.coalesce(sold.c.revenue, 0),
                func.sum(quantity).over(),
            )
            .outerjoin(sold, sold.c.category_id == Category.id)
            .order_by(Category.sort_order, Category.id)
        )
    ).all()

    total = int(rows[0][5]) if rows else 0
    return CategoriesRead(
        items=[
            CategoryShare(
                category_id=category_id,
                name=name,
                color=color,
                quantity=int(qty),
                revenue=int(rev),
                share=_share(int(qty), total),
            )
            for category_id, name, color, qty, rev, _ in rows
        ],
        total_quantity=total,
    )


async def get_locations_comparison(
    session: AsyncSession, filters: AnalyticsFilters
) -> list[LocationComparison]:
    """All locations side by side; `filters.location_id` is ignored on purpose."""
    p = _periods(filters)
    in_current = Order.created_at >= p.cur_start
    per_location = (
        select(
            Order.location_id,
            func.sum(Order.total_amount).filter(in_current).label("revenue"),
            func.count(Order.id).filter(in_current).label("orders"),
            func.sum(Order.total_amount).filter(~in_current).label("prev_revenue"),
        )
        .where(*_conditions(p.prev_start, p.end, None))
        .group_by(Order.location_id)
        .subquery()
    )
    rows = (
        await session.execute(
            select(
                Location.id,
                Location.name,
                func.coalesce(per_location.c.revenue, 0),
                func.coalesce(per_location.c.orders, 0),
                func.coalesce(per_location.c.prev_revenue, 0),
            )
            .outerjoin(per_location, per_location.c.location_id == Location.id)
            .order_by(Location.id)
        )
    ).all()
    result: list[LocationComparison] = []
    for location_id, name, revenue, orders, prev_revenue in rows:
        revenue, orders, prev_revenue = int(revenue), int(orders), int(prev_revenue)
        result.append(
            LocationComparison(
                location_id=location_id,
                name=name,
                revenue=revenue,
                orders=orders,
                avg_check=_avg_check(revenue, orders),
                delta_pct=delta_pct(revenue, prev_revenue),
            )
        )
    return result
