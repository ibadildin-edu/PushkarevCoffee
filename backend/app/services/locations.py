from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.period import local_range_utc, local_today
from app.models import Location, Order, OrderStatus
from app.schemas.location import LocationKpi, LocationRead, LocationWithKpi
from app.services.errors import NotFoundError

KPI_DAYS = 30


async def list_locations_with_kpi(session: AsyncSession) -> list[LocationWithKpi]:
    today = local_today()
    start, end = local_range_utc(today - timedelta(days=KPI_DAYS - 1), today)

    kpi = (
        select(
            Order.location_id,
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(
            Order.created_at >= start,
            Order.created_at < end,
            Order.status != OrderStatus.cancelled,
        )
        .group_by(Order.location_id)
        .subquery()
    )
    stmt = (
        select(
            Location,
            func.coalesce(kpi.c.revenue, 0).label("revenue"),
            func.coalesce(kpi.c.orders, 0).label("orders"),
        )
        .outerjoin(kpi, kpi.c.location_id == Location.id)
        .order_by(Location.id)
    )
    rows = (await session.execute(stmt)).all()

    result: list[LocationWithKpi] = []
    for location, revenue, orders in rows:
        revenue, orders = int(revenue), int(orders)
        result.append(
            LocationWithKpi(
                **LocationRead.model_validate(location).model_dump(),
                kpi_30d=LocationKpi(
                    revenue=revenue,
                    orders=orders,
                    avg_check=round(revenue / orders) if orders else 0,
                ),
            )
        )
    return result


async def get_location(session: AsyncSession, location_id: int) -> Location:
    location = await session.get(Location, location_id)
    if location is None:
        raise NotFoundError(f"Location {location_id} not found")
    return location
