from fastapi import APIRouter

from app.api.deps import SessionDep
from app.models import Location
from app.schemas.location import LocationRead, LocationWithKpi
from app.services import locations as service

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationWithKpi])
async def list_locations(session: SessionDep) -> list[LocationWithKpi]:
    return await service.list_locations_with_kpi(session)


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: int, session: SessionDep) -> Location:
    return await service.get_location(session, location_id)
