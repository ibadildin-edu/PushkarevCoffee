from datetime import date

from app.schemas.common import ORMModel


class LocationRead(ORMModel):
    id: int
    name: str
    slug: str
    address: str
    opened_at: date
    is_active: bool


class LocationKpi(ORMModel):
    """Short KPI for the last 30 days (Asia/Almaty), cancelled orders excluded."""

    revenue: int
    orders: int
    avg_check: int


class LocationWithKpi(LocationRead):
    kpi_30d: LocationKpi
