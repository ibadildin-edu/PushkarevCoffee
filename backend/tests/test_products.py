from httpx import AsyncClient

from tests.conftest import Dataset


async def test_list_categories_sorted(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    assert [c["name"] for c in response.json()] == ["Кофе", "Выпечка"]


async def test_list_products_with_filters(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    body = response.json()
    assert [p["name"] for p in body] == ["Американо", "Латте", "Круассан"]
    assert body[0]["category"] == {"id": dataset.coffee_id, "name": "Кофе", "color": "#3B2418"}

    response = await client.get("/api/v1/products", params={"category_id": dataset.bakery_id})
    assert [p["name"] for p in response.json()] == ["Круассан"]

    response = await client.get("/api/v1/products", params={"search": "лат"})
    assert [p["name"] for p in response.json()] == ["Латте"]


async def test_create_product(client: AsyncClient, dataset: Dataset) -> None:
    payload = {"name": "  Раф ванильный ", "category_id": dataset.coffee_id, "price": 1700}
    response = await client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Раф ванильный"
    assert body["price"] == 1700
    assert body["is_active"] is True
    assert body["category"]["name"] == "Кофе"

    response = await client.get(f"/api/v1/products/{body['id']}")
    assert response.status_code == 200


async def test_create_product_validation(client: AsyncClient, dataset: Dataset) -> None:
    bad_price = {"name": "X", "category_id": dataset.coffee_id, "price": 0}
    assert (await client.post("/api/v1/products", json=bad_price)).status_code == 422

    no_category = {"name": "X", "category_id": 999, "price": 100}
    assert (await client.post("/api/v1/products", json=no_category)).status_code == 422

    duplicate = {"name": "латте", "category_id": dataset.coffee_id, "price": 100}
    assert (await client.post("/api/v1/products", json=duplicate)).status_code == 409


async def test_update_product(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.patch(
        f"/api/v1/products/{dataset.latte_id}",
        json={"price": 1600, "category_id": dataset.bakery_id},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["price"] == 1600
    assert body["name"] == "Латте"
    assert body["category"]["name"] == "Выпечка"

    response = await client.patch(
        f"/api/v1/products/{dataset.latte_id}", json={"name": "Американо"}
    )
    assert response.status_code == 409

    assert (await client.patch("/api/v1/products/999", json={"price": 1})).status_code == 404


async def test_delete_product_is_soft(client: AsyncClient, dataset: Dataset) -> None:
    response = await client.delete(f"/api/v1/products/{dataset.americano_id}")
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Still readable, and order history keeps referencing it.
    response = await client.get(f"/api/v1/products/{dataset.americano_id}")
    assert response.status_code == 200

    response = await client.get("/api/v1/products", params={"is_active": True})
    assert "Американо" not in [p["name"] for p in response.json()]

    response = await client.get(f"/api/v1/orders/{dataset.order_ids[0]}")
    assert response.json()["items"][0]["product_name"] == "Американо"
