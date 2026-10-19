from datetime import date

import pytest
from httpx import AsyncClient

from app.services import orders as orders_service
from tests.conftest import Dataset


async def test_recent_orders(
    client: AsyncClient, dataset: Dataset, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(orders_service, "local_today", lambda: date(2026, 10, 11))

    response = await client.get("/api/v1/orders/recent", params={"limit": 3})
    assert response.status_code == 200, response.text
    body = response.json()

    # Newest first, any status.
    assert [o["number"] for o in body["items"]] == [1004, 1003, 1002]
    assert body["items"][0]["items_summary"] == "Американо, Круассан ×2"
    assert body["items"][0]["location_name"] == "Кампус"
    assert body["items"][1]["status"] == "cancelled"
    assert body["items"][2]["items_summary"] == "Латте ×2, Круассан"
    # Today = Oct 11 local: #1004 only, the cancelled #1003 is not counted.
    assert body["today"] == {"orders": 1, "revenue": 3500}


async def test_recent_orders_by_location(
    client: AsyncClient, dataset: Dataset, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(orders_service, "local_today", lambda: date(2026, 10, 10))

    response = await client.get("/api/v1/orders/recent", params={"location_id": dataset.center_id})
    body = response.json()
    assert [o["number"] for o in body["items"]] == [1002]
    assert body["today"] == {"orders": 1, "revenue": 4200}
