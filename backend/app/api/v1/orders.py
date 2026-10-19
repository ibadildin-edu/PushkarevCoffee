from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.schemas.common import Page
from app.schemas.order import OrderFilters, OrderListItem, OrderRead
from app.services import orders as service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=Page[OrderListItem])
async def list_orders(
    filters: Annotated[OrderFilters, Query()], session: SessionDep
) -> Page[OrderListItem]:
    return await service.list_orders(session, filters)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, session: SessionDep) -> OrderRead:
    return await service.get_order(session, order_id)
