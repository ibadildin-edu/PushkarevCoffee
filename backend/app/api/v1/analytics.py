from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.schemas.analytics import (
    AnalyticsFilters,
    CategoriesRead,
    HeatmapRead,
    KpiRead,
    LocationComparison,
    RevenueDailyRead,
    TopProduct,
    TopProductsFilters,
)
from app.services import analytics as service

router = APIRouter(prefix="/analytics", tags=["analytics"])

Filters = Annotated[AnalyticsFilters, Query()]


@router.get("/kpi", response_model=KpiRead)
async def kpi(filters: Filters, session: SessionDep) -> KpiRead:
    return await service.get_kpi(session, filters)


@router.get("/revenue-daily", response_model=RevenueDailyRead)
async def revenue_daily(filters: Filters, session: SessionDep) -> RevenueDailyRead:
    return await service.get_revenue_daily(session, filters)


@router.get("/top-products", response_model=list[TopProduct])
async def top_products(
    filters: Annotated[TopProductsFilters, Query()], session: SessionDep
) -> list[TopProduct]:
    return await service.get_top_products(session, filters)


@router.get("/heatmap", response_model=HeatmapRead)
async def heatmap(filters: Filters, session: SessionDep) -> HeatmapRead:
    return await service.get_heatmap(session, filters)


@router.get("/categories", response_model=CategoriesRead)
async def categories(filters: Filters, session: SessionDep) -> CategoriesRead:
    return await service.get_categories(session, filters)


@router.get("/locations-comparison", response_model=list[LocationComparison])
async def locations_comparison(filters: Filters, session: SessionDep) -> list[LocationComparison]:
    return await service.get_locations_comparison(session, filters)
