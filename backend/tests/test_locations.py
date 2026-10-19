from datetime import date

import pytest
from httpx import AsyncClient

from app.services import locations as locations_service
from tests.conftest import Dataset


async def test_list_locations_with_kpi(
    client: AsyncClient, dataset: Dataset, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Pin "today" so the 30-day window covers the fixture orders.
    monkeypatch.setattr(locations_service, "local_today", lambda: date(2026, 10, 15))

    response = await client.get("/api/v1/locations")
    assert response.status_code == 200
    by_name = {loc["name"]: loc for loc in response.json()}

    # Campus: 1100 (completed) + 3500 (preparing); the cancelled order is excluded.
    assert by_name["Кампус"]["kpi_30d"] == {"revenue": 4600, "orders": 2, "avg_check": 2300}
    assert by_name["Центр"]["kpi_30d"] == {"revenue": 4200, "orders": 1, "avg_check": 4200}


async def test_location_kpi_outside_window_is_zero(
    client: AsyncClient, dataset: Dataset, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(locations_service, "local_today", lambda: date(2027, 1, 1))
    response = await client.get("/api/v1/locations")
    assert all(
        loc["kpi_30d"] == {"revenue": 0, "orders": 0, "avg_check": 0} for loc in response.json()
    )


async def test_get_location(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.get(f"/api/v1/locations/{dataset.campus_id}")
    assert response.status_code == 200
    assert response.json()["slug"] == "campus"

    assert (await client.get("/api/v1/locations/999")).status_code == 404
