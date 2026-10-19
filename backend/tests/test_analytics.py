"""Aggregations on the fixture dataset (see conftest.Dataset), in Almaty local time:

- #1001 Кампус, Sat 2026-10-10 09:00, completed: Американо ×1 = 1100
- #1002 Центр,  Sat 2026-10-10 14:00, completed: Латте ×2 + Круассан ×1 = 4200
- #1003 Кампус, Sun 2026-10-11 00:30, cancelled: Латте ×1 = 1500 (never counted)
- #1004 Кампус, Sun 2026-10-11 11:00, preparing: Американо ×1 + Круассан ×2 = 3500
"""

from typing import Any

from httpx import AsyncClient

from tests.conftest import Dataset

WEEKEND = {"date_from": "2026-10-10", "date_to": "2026-10-11"}
SUNDAY = {"date_from": "2026-10-11", "date_to": "2026-10-11"}


async def get(client: AsyncClient, path: str, **params: Any) -> Any:
    response = await client.get(f"/api/v1/analytics/{path}", params=params)
    assert response.status_code == 200, response.text
    return response.json()


async def test_kpi(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "kpi", **WEEKEND)
    # Previous period (Oct 8-9) is empty, so there is no delta.
    assert body["revenue"] == {"value": 8800, "prev": 0, "delta_pct": None}
    assert body["orders"] == {"value": 3, "prev": 0, "delta_pct": None}
    assert body["avg_check"] == {"value": 2933, "prev": 0, "delta_pct": None}
    # Croissant: 3 of 7 sold items.
    assert body["best_product"] == {
        "product_id": dataset.croissant_id,
        "name": "Круассан",
        "quantity": 3,
        "share": 42.9,
        "prev": 0,
        "delta_pct": None,
    }


async def test_kpi_compares_with_previous_period(client: AsyncClient, dataset: Dataset) -> None:
    # Sunday vs Saturday.
    body = await get(client, "kpi", **SUNDAY)
    assert body["revenue"] == {"value": 3500, "prev": 5300, "delta_pct": -34.0}
    assert body["orders"] == {"value": 1, "prev": 2, "delta_pct": -50.0}
    assert body["avg_check"] == {"value": 3500, "prev": 2650, "delta_pct": 32.1}
    assert body["best_product"]["name"] == "Круассан"
    assert body["best_product"]["prev"] == 1
    assert body["best_product"]["delta_pct"] == 100.0


async def test_kpi_by_location_and_empty_period(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "kpi", **WEEKEND, location_id=dataset.campus_id)
    assert body["revenue"]["value"] == 4600
    assert body["avg_check"]["value"] == 2300
    # Americano and croissant both sold 2; croissant wins on revenue (2400 vs 2200).
    assert body["best_product"]["name"] == "Круассан"

    empty = await get(client, "kpi", date_from="2027-01-01", date_to="2027-01-07")
    assert empty["revenue"]["value"] == 0
    assert empty["best_product"] is None


async def test_invalid_range(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/analytics/kpi", params={"date_from": "2026-10-11", "date_to": "2026-10-10"}
    )
    assert response.status_code == 422


async def test_revenue_daily(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "revenue-daily", **WEEKEND)
    assert body["points"] == [
        {"date": "2026-10-10", "revenue": 5300, "orders": 2, "prev_revenue": 0},
        {"date": "2026-10-11", "revenue": 3500, "orders": 1, "prev_revenue": 0},
    ]
    assert body["avg"] == 4400
    assert body["max"] == {"date": "2026-10-10", "value": 5300}
    assert (body["prev_date_from"], body["prev_date_to"]) == ("2026-10-08", "2026-10-09")

    sunday = await get(client, "revenue-daily", **SUNDAY)
    # The previous period is aligned by day index: Sunday is compared with Saturday.
    assert sunday["points"] == [
        {"date": "2026-10-11", "revenue": 3500, "orders": 1, "prev_revenue": 5300}
    ]


async def test_top_products(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "top-products", **WEEKEND)
    assert [(p["name"], p["quantity"], p["revenue"]) for p in body] == [
        ("Круассан", 3, 3600),
        ("Латте", 2, 3000),
        ("Американо", 2, 2200),
    ]
    assert body[0]["category"] == "Выпечка"
    assert body[0]["category_color"] == "#E5CBA8"

    limited = await get(client, "top-products", **WEEKEND, limit=1)
    assert len(limited) == 1


async def test_categories(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "categories", **WEEKEND)
    assert body["total_quantity"] == 7
    assert [(c["name"], c["quantity"], c["revenue"], c["share"]) for c in body["items"]] == [
        ("Кофе", 4, 5200, 57.1),
        ("Выпечка", 3, 3600, 42.9),
    ]


async def test_heatmap(client: AsyncClient, dataset: Dataset) -> None:
    body = await get(client, "heatmap", **WEEKEND)
    cells = {(c["weekday"], c["hour"]): c["avg_orders"] for c in body["cells"]}
    assert len(cells) == 7 * 16
    assert cells[(6, 9)] == 1.0
    assert cells[(6, 14)] == 1.0
    assert cells[(7, 11)] == 1.0
    # The cancelled order at Sun 00:30 is excluded (and outside opening hours anyway).
    assert sum(cells.values()) == 3.0
    assert body["peak"] == {"weekday": 6, "hour": 9, "avg_orders": 1.0}


async def test_heatmap_averages_over_weekday_occurrences(
    client: AsyncClient, dataset: Dataset
) -> None:
    # Two Saturdays (Oct 3 and Oct 10) in the range, one order at Sat 09:00 -> 0.5.
    body = await get(client, "heatmap", date_from="2026-10-03", date_to="2026-10-11")
    cells = {(c["weekday"], c["hour"]): c["avg_orders"] for c in body["cells"]}
    assert cells[(6, 9)] == 0.5
    assert cells[(7, 11)] == 0.5


async def test_locations_comparison(client: AsyncClient, dataset: Dataset) -> None:
    # location_id is ignored: the widget always compares all locations.
    body = await get(client, "locations-comparison", **SUNDAY, location_id=dataset.center_id)
    assert body == [
        {
            "location_id": dataset.campus_id,
            "name": "Кампус",
            "revenue": 3500,
            "orders": 1,
            "avg_check": 3500,
            "delta_pct": 218.2,
        },
        {
            "location_id": dataset.center_id,
            "name": "Центр",
            "revenue": 0,
            "orders": 0,
            "avg_check": 0,
            "delta_pct": -100.0,
        },
    ]
