from typing import Any

from httpx import AsyncClient

from tests.conftest import Dataset


async def numbers(client: AsyncClient, **params: Any) -> list[int]:
    response = await client.get("/api/v1/orders", params=params)
    assert response.status_code == 200, response.text
    return [o["number"] for o in response.json()["items"]]


async def test_list_orders_default(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.get("/api/v1/orders")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 4
    assert body["page"] == 1
    assert body["page_size"] == 20
    # Newest first by default.
    assert [o["number"] for o in body["items"]] == [1004, 1003, 1002, 1001]
    assert body["items"][0]["location_name"] == "Кампус"
    assert body["items"][0]["items_count"] == 3
    assert body["items"][0]["total_amount"] == 3500


async def test_date_filter_uses_almaty_days(client: AsyncClient, dataset: Dataset) -> None:
    # Order 1003 is 19:30 UTC on Oct 10, i.e. 00:30 on Oct 11 in Almaty.
    assert await numbers(client, date_from="2026-10-11", date_to="2026-10-11") == [1004, 1003]
    assert await numbers(client, date_to="2026-10-10") == [1002, 1001]
    assert await numbers(client, date_from="2026-10-11") == [1004, 1003]


async def test_filters(client: AsyncClient, dataset: Dataset) -> None:
    assert await numbers(client, location_id=dataset.center_id) == [1002]
    assert await numbers(client, status="cancelled") == [1003]
    assert await numbers(client, product_id=dataset.croissant_id) == [1004, 1002]
    assert await numbers(client, min_total=2000) == [1004, 1002]
    assert await numbers(client, max_total=1500) == [1003, 1001]
    assert await numbers(
        client, location_id=dataset.campus_id, product_id=dataset.americano_id
    ) == [1004, 1001]


async def test_sort_and_pagination(client: AsyncClient, dataset: Dataset) -> None:
    assert await numbers(client, sort="total_amount") == [1001, 1003, 1004, 1002]
    assert await numbers(client, sort="number") == [1001, 1002, 1003, 1004]

    response = await client.get("/api/v1/orders", params={"page": 2, "page_size": 3})
    body = response.json()
    assert body["total"] == 4
    assert [o["number"] for o in body["items"]] == [1001]


async def test_invalid_filters(client: AsyncClient, dataset: Dataset) -> None:
    for params in (
        {"date_from": "2026-10-12", "date_to": "2026-10-10"},
        {"min_total": 500, "max_total": 100},
        {"status": "unknown"},
        {"sort": "-price"},
        {"page_size": 1000},
    ):
        response = await client.get("/api/v1/orders", params=params)
        assert response.status_code == 422, params


async def test_get_order_with_items(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.get(f"/api/v1/orders/{dataset.order_ids[1]}")
    assert response.status_code == 200
    body = response.json()
    assert body["number"] == 1002
    assert body["location"] == {"id": dataset.center_id, "name": "Центр"}
    assert [(i["product_name"], i["quantity"], i["line_total"]) for i in body["items"]] == [
        ("Латте", 2, 3000),
        ("Круассан", 1, 1200),
    ]
    assert body["total_amount"] == 4200

    assert (await client.get("/api/v1/orders/999")).status_code == 404


async def test_health(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.json() == {"status": "ok", "database": "ok"}
