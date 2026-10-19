"""Live mode: a background task that creates new orders and completes old ones.

Order creation runs only while the simulator is enabled (PUT /api/v1/simulator).
Completion of `preparing` orders runs on every tick, so orders never get stuck.
State is in-memory: one API process, resets to "off" on restart.
"""

import asyncio
import contextlib
import logging
import random
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.models import Category, Location, Order, OrderItem, OrderStatus, Product
from app.seed import data
from app.seed.generator import poisson

logger = logging.getLogger(__name__)

TICK_SECONDS = 3.0
# Demo acceleration: real rates give ~1 order per location every few minutes.
SPEED = 6.0
# Keeps the demo alive outside opening hours.
MIN_HOURLY_WEIGHT = 0.3
DEFAULT_BASE_PER_HOUR = 5.0
BASKET_SIZES = ((1, 2, 3, 4), (0.5, 0.3, 0.15, 0.05))


class SimulatorState:
    def __init__(self) -> None:
        self.enabled = False


state = SimulatorState()


def is_enabled() -> bool:
    return state.enabled


def set_enabled(enabled: bool) -> bool:
    state.enabled = enabled
    return state.enabled


async def complete_ready_orders(session: AsyncSession, now: datetime) -> int:
    """`preparing` -> `completed` after 2-5 minutes (deterministic per order id)."""
    ready_after = func.make_interval(0, 0, 0, 0, 0, 2 + Order.id % 4)
    result = await session.execute(
        update(Order)
        .where(Order.status == OrderStatus.preparing, Order.created_at + ready_after <= now)
        .values(status=OrderStatus.completed)
    )
    return int(getattr(result, "rowcount", 0) or 0)


async def create_orders(session: AsyncSession, now: datetime, rng: random.Random) -> int:
    """Creates a Poisson-distributed number of orders per location for one tick."""
    local = now.astimezone(settings.tz)
    hour_weight = max(data.HOURLY_PROFILE.get(local.hour, 0.0), MIN_HOURLY_WEIGHT)
    seeds = {seed.slug: seed for seed in data.LOCATIONS}
    category_weights = {seed.slug: seed.weight for seed in data.CATEGORIES}

    locations = (await session.scalars(select(Location).where(Location.is_active))).all()
    product_rows = (
        await session.execute(
            select(Product, Category.slug)
            .join(Category, Category.id == Product.category_id)
            .where(Product.is_active)
        )
    ).all()
    if not locations or not product_rows:
        return 0
    products = [product for product, _ in product_rows]
    weights = [category_weights.get(slug, 0.1) for _, slug in product_rows]

    next_number = (await session.scalar(select(func.max(Order.number))) or 1000) + 1
    created = 0
    for location in locations:
        seed = seeds.get(location.slug)
        base = seed.base_per_hour if seed else DEFAULT_BASE_PER_HOUR
        weekday = seed.weekday_factor[local.isoweekday()] if seed else 1.0
        lam = base * hour_weight * weekday * SPEED * TICK_SECONDS / 3600
        for _ in range(poisson(rng, lam)):
            lines: dict[int, tuple[Product, int]] = {}
            for _ in range(rng.choices(*BASKET_SIZES)[0]):
                product = rng.choices(products, weights)[0]
                _, quantity = lines.get(product.id, (product, 0))
                lines[product.id] = (product, quantity + 1)
            items = [
                OrderItem(
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                    line_total=product.price * quantity,
                )
                for product, quantity in lines.values()
            ]
            session.add(
                Order(
                    number=next_number,
                    location_id=location.id,
                    created_at=now,
                    status=OrderStatus.preparing,
                    total_amount=sum(item.line_total for item in items),
                    items_count=sum(item.quantity for item in items),
                    items=items,
                )
            )
            next_number += 1
            created += 1
    return created


async def tick(session: AsyncSession, now: datetime, rng: random.Random) -> int:
    created = await create_orders(session, now, rng) if is_enabled() else 0
    await complete_ready_orders(session, now)
    await session.commit()
    return created


async def run(session_maker: async_sessionmaker[AsyncSession], stop: asyncio.Event) -> None:
    rng = random.Random()
    while not stop.is_set():
        try:
            async with session_maker() as session:
                await tick(session, datetime.now(UTC), rng)
        except Exception:
            # Keep the loop alive (e.g. while the database restarts).
            logger.exception("Simulator tick failed")
        with contextlib.suppress(TimeoutError):
            await asyncio.wait_for(stop.wait(), timeout=TICK_SECONDS)
