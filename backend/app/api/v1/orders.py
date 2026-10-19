from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.schemas.common import Page
from app.schemas.order import OrderFilters, OrderListItem, OrderRead, RecentOrdersRead
from app.services import orders as service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=Page[OrderListItem])
async def list_orders(
    filters: Annotated[OrderFilters, Query()], session: SessionDep
) -> Page[OrderListItem]:
    return await service.list_orders(session, filters)


# Declared before /{order_id} so "recent" is not parsed as an id.
@router.get("/recent", response_model=RecentOrdersRead)
async def recent_orders(
    session: SessionDep,
    location_id: int | None = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> RecentOrdersRead:
    return await service.list_recent_orders(session, location_id, limit)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, session: SessionDep) -> OrderRead:
    return await service.get_order(session, order_id)
