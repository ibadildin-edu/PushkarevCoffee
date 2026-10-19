from datetime import date
from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

MAX_RANGE_DAYS = 366


class AnalyticsFilters(BaseModel):
    date_from: date = Field(description="Local (Asia/Almaty) date, inclusive")
    date_to: date = Field(description="Local (Asia/Almaty) date, inclusive")
    location_id: int | None = None

    @model_validator(mode="after")
    def check_range(self) -> Self:
        if self.date_from > self.date_to:
            raise ValueError("date_from must be <= date_to")
        if (self.date_to - self.date_from).days + 1 > MAX_RANGE_DAYS:
            raise ValueError(f"Range must not exceed {MAX_RANGE_DAYS} days")
        return self

    @property
    def days(self) -> int:
        return (self.date_to - self.date_from).days + 1


class TopProductsFilters(AnalyticsFilters):
    limit: Annotated[int, Field(ge=1, le=50)] = 10


class Metric(BaseModel):
    value: int
    prev: int
    # None when the previous period has no data.
    delta_pct: float | None


class BestProduct(BaseModel):
    product_id: int
    name: str
    quantity: int
    # Share of all sold items in the period, percent.
    share: float
    prev: int
    delta_pct: float | None


class KpiRead(BaseModel):
    revenue: Metric
    orders: Metric
    avg_check: Metric
    best_product: BestProduct | None


class RevenuePoint(BaseModel):
    date: date
    revenue: int
    orders: int
    # Revenue of the matching day of the previous period (same index from the start).
    prev_revenue: int


class DayValue(BaseModel):
    date: date
    value: int


class RevenueDailyRead(BaseModel):
    points: list[RevenuePoint]
    avg: int
    max: DayValue | None
    prev_date_from: date
    prev_date_to: date


class TopProduct(BaseModel):
    product_id: int
    name: str
    category: str
    category_color: str
    quantity: int
    revenue: int


class HeatmapCell(BaseModel):
    weekday: Annotated[int, Field(ge=1, le=7, description="ISO weekday, 1 = Monday")]
    hour: int
    avg_orders: float


class HeatmapRead(BaseModel):
    cells: list[HeatmapCell]
    peak: HeatmapCell | None


class CategoryShare(BaseModel):
    category_id: int
    name: str
    color: str
    quantity: int
    revenue: int
    # Share of sold items, percent.
    share: float


class CategoriesRead(BaseModel):
    items: list[CategoryShare]
    total_quantity: int


class LocationComparison(BaseModel):
    location_id: int
    name: str
    revenue: int
    orders: int
    avg_check: int
    # Revenue change vs the previous period.
    delta_pct: float | None
