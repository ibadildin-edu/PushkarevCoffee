from fastapi import APIRouter

from app.schemas.simulator import SimulatorState, SimulatorUpdate
from app.services import simulator as service

router = APIRouter(prefix="/simulator", tags=["simulator"])


@router.get("", response_model=SimulatorState)
async def get_simulator() -> SimulatorState:
    return SimulatorState(enabled=service.is_enabled())


@router.put("", response_model=SimulatorState)
async def update_simulator(data: SimulatorUpdate) -> SimulatorState:
    return SimulatorState(enabled=service.set_enabled(data.enabled))
