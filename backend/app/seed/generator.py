"""Deterministic demo data generator: locations, menu and N days of orders."""

import math
import random
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func, insert, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Category, Location, Order, OrderItem, OrderStatus, Product
from app.seed import data

BATCH_SIZE = 5000


@dataclass
class GeneratedOrder:
    created_at: datetime
    location_id: int
    # product_id -> quantity
    lines: dict[int, int] = field(default_factory=dict)


@dataclass(frozen=True)
class SeedStats:
    locations: int
    categories: int
    products: int
    orders: int
    order_items: int


def poisson(rng: random.Random, lam: float) -> int:
    """Knuth's algorithm; fine for the small rates used here."""
    if lam <= 0:
        return 0
    threshold = math.exp(-lam)
    k, p = 0, 1.0
    while True:
        p *= rng.random()
        if p <= threshold:
            return k
        k += 1


class ProductPicker:
    """Weighted product choice per location: category share x popularity x price bias."""

    def __init__(self, products: list[Product], category_slugs: dict[int, str]) -> None:
        self._by_category: dict[str, list[Product]] = {}
        for product in products:
            self._by_category.setdefault(category_slugs[product.category_id], []).append(product)
        self._popularity = {p.name: p.popularity for p in data.PRODUCTS}
        self._category_slugs = [c.slug for c in data.CATEGORIES]
        self._category_weights = [c.weight for c in data.CATEGORIES]
        self._weights_cache: dict[tuple[str, float], list[float]] = {}

    def _weights(self, category: str, price_bias: float) -> list[float]:
        key = (category, price_bias)
        if key not in self._weights_cache:
            items = self._by_category[category]
            mean_price = sum(p.price for p in items) / len(items)
            self._weights_cache[key] = [
                self._popularity[p.name] * (p.price / mean_price) ** price_bias for p in items
            ]
        return self._weights_cache[key]

    def pick(self, rng: random.Random, price_bias: float) -> Product:
        category = rng.choices(self._category_slugs, self._category_weights)[0]
        items = self._by_category[category]
        return rng.choices(items, self._weights(category, price_bias))[0]


async def reset_database(session: AsyncSession) -> None:
    await session.execute(
        text(
            "TRUNCATE order_items, orders, products, categories, locations RESTART IDENTITY CASCADE"
        )
    )


async def _insert_reference_data(
    session: AsyncSession, products_created_at: datetime
) -> tuple[list[Location], list[Product], dict[int, str]]:
    locations = [
        Location(slug=s.slug, name=s.name, address=s.address, opened_at=s.opened_at)
        for s in data.LOCATIONS
    ]
    categories = [
        Category(slug=s.slug, name=s.name, color=s.color, sort_order=i)
        for i, s in enumerate(data.CATEGORIES, start=1)
    ]
    session.add_all([*locations, *categories])
    await session.flush()

    category_ids = {c.slug: c.id for c in categories}
    products = [
        Product(
            category_id=category_ids[s.category],
            name=s.name,
            price=s.price,
            created_at=products_created_at,
            updated_at=products_created_at,
        )
        for s in data.PRODUCTS
    ]
    session.add_all(products)
    await session.flush()
    return locations, products, {c.id: c.slug for c in categories}


def _generate_orders(
    rng: random.Random,
    locations: list[Location],
    picker: ProductPicker,
    first_day: date,
    days: int,
    now: datetime,
) -> list[GeneratedOrder]:
    tz = settings.tz
    seeds = {s.slug: s for s in data.LOCATIONS}
    orders: list[GeneratedOrder] = []

    for day_index in range(days):
        day = first_day + timedelta(days=day_index)
        # Light upward trend across the period (~ +15%).
        trend = 0.93 + 0.15 * day_index / max(days - 1, 1)
        for location in locations:
            seed = seeds[location.slug]
            day_noise = min(max(rng.gauss(1.0, 0.08), 0.75), 1.25)
            day_factor = seed.weekday_factor[day.isoweekday()] * trend * day_noise
            for hour in range(data.OPEN_HOUR, data.CLOSE_HOUR + 1):
                hour_start = datetime.combine(day, time(hour), tzinfo=tz)
                if hour_start >= now:
                    break
                evening = seed.evening_factor if hour >= 18 else 1.0
                lam = seed.base_per_hour * data.HOURLY_PROFILE[hour] * evening * day_factor
                for _ in range(poisson(rng, lam)):
                    created_at = hour_start + timedelta(seconds=rng.randrange(3600))
                    if created_at > now:
                        continue
                    order = GeneratedOrder(created_at=created_at, location_id=location.id)
                    lines_count = rng.choices((1, 2, 3, 4), seed.basket_sizes)[0]
                    for _ in range(lines_count):
                        product = picker.pick(rng, seed.price_bias)
                        quantity = 2 if rng.random() < 0.08 else 1
                        order.lines[product.id] = order.lines.get(product.id, 0) + quantity
                    orders.append(order)

    orders.sort(key=lambda o: o.created_at)
    return orders


async def _insert_batches(
    session: AsyncSession, model: type[Order] | type[OrderItem], rows: list[dict[str, Any]]
) -> None:
    for start in range(0, len(rows), BATCH_SIZE):
        await session.execute(insert(model), rows[start : start + BATCH_SIZE])


async def _sync_sequences(session: AsyncSession) -> None:
    for table in ("locations", "categories", "products", "orders", "order_items"):
        await session.execute(
            text(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false)"
            )
        )


async def seed(session: AsyncSession, *, days: int, reset: bool, random_seed: int) -> SeedStats:
    if reset:
        await reset_database(session)
    elif await session.scalar(select(func.count(Location.id))):
        raise RuntimeError("Database is not empty. Re-run with --reset to wipe and reseed.")

    rng = random.Random(random_seed)
    now = datetime.now(UTC)
    today = now.astimezone(settings.tz).date()
    first_day = today - timedelta(days=days - 1)
    products_created_at = datetime.combine(
        first_day - timedelta(days=30), time(9), tzinfo=settings.tz
    )

    locations, products, category_slugs = await _insert_reference_data(session, products_created_at)
    prices = {p.id: p.price for p in products}
    picker = ProductPicker(products, category_slugs)
    generated = _generate_orders(rng, locations, picker, first_day, days, now)

    preparing_after = now - timedelta(minutes=data.PREPARING_WINDOW_MINUTES)
    order_rows: list[dict[str, Any]] = []
    item_rows: list[dict[str, Any]] = []
    for order_id, order in enumerate(generated, start=1):
        if order.created_at >= preparing_after:
            status = OrderStatus.preparing
        elif rng.random() < data.CANCEL_RATE:
            status = OrderStatus.cancelled
        else:
            status = OrderStatus.completed

        total = 0
        for product_id, quantity in order.lines.items():
            line_total = prices[product_id] * quantity
            total += line_total
            item_rows.append(
                {
                    "order_id": order_id,
                    "product_id": product_id,
                    "quantity": quantity,
                    "unit_price": prices[product_id],
                    "line_total": line_total,
                }
            )
        order_rows.append(
            {
                "id": order_id,
                "number": data.FIRST_ORDER_NUMBER + order_id - 1,
                "location_id": order.location_id,
                "created_at": order.created_at.astimezone(UTC),
                "status": status,
                "total_amount": total,
                "items_count": sum(order.lines.values()),
            }
        )

    await _insert_batches(session, Order, order_rows)
    await _insert_batches(session, OrderItem, item_rows)
    await _sync_sequences(session)
    await session.commit()

    return SeedStats(
        locations=len(locations),
        categories=len(data.CATEGORIES),
        products=len(products),
        orders=len(order_rows),
        order_items=len(item_rows),
    )
