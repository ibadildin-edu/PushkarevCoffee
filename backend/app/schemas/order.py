from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

from app.models.order import OrderStatus
from app.schemas.common import ORMModel


class OrderSort(StrEnum):
    created_at_asc = "created_at"
    created_at_desc = "-created_at"
    total_asc = "total_amount"
    total_desc = "-total_amount"
    number_asc = "number"
    number_desc = "-number"


class OrderFilters(BaseModel):
    date_from: date | None = Field(None, description="Local (Asia/Almaty) date, inclusive")
    date_to: date | None = Field(None, description="Local (Asia/Almaty) date, inclusive")
    location_id: int | None = None
    status: OrderStatus | None = None
    product_id: int | None = Field(None, description="Orders that contain this product")
    min_total: Annotated[int | None, Field(ge=0)] = None
    max_total: Annotated[int | None, Field(ge=0)] = None
    page: Annotated[int, Field(ge=1)] = 1
    page_size: Annotated[int, Field(ge=1, le=100)] = 20
    sort: OrderSort = OrderSort.created_at_desc

    @model_validator(mode="after")
    def check_ranges(self) -> Self:
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from must be <= date_to")
        if (
            self.min_total is not None
            and self.max_total is not None
            and self.min_total > self.max_total
        ):
            raise ValueError("min_total must be <= max_total")
        return self


class OrderListItem(BaseModel):
    id: int
    number: int
    created_at: datetime
    status: OrderStatus
    total_amount: int
    items_count: int
    location_id: int
    location_name: str


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: int
    line_total: int


class OrderLocation(ORMModel):
    id: int
    name: str


class OrderRead(BaseModel):
    id: int
    number: int
    created_at: datetime
    status: OrderStatus
    total_amount: int
    items_count: int
    location: OrderLocation
    items: list[OrderItemRead]


class RecentOrder(BaseModel):
    id: int
    number: int
    created_at: datetime
    status: OrderStatus
    total_amount: int
    location_id: int
    location_name: str
    # "Раф ванильный, Латте ×2"
    items_summary: str


class TodayStats(BaseModel):
    """Today (Asia/Almaty), cancelled orders excluded."""

    orders: int
    revenue: int


class RecentOrdersRead(BaseModel):
    items: list[RecentOrder]
    today: TodayStats
