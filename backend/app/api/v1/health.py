from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import SessionDep
from app.schemas.common import HealthRead

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthRead)
async def health(session: SessionDep) -> HealthRead:
    await session.execute(text("SELECT 1"))
    return HealthRead(status="ok", database="ok")
