import random
from collections.abc import Iterator
from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Order, OrderItem, OrderStatus
from app.services import simulator
from tests.conftest import Dataset, utc


@pytest.fixture(autouse=True)
def reset_simulator() -> Iterator[None]:
    simulator.set_enabled(False)
    yield
    simulator.set_enabled(False)


async def test_toggle_simulator(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/simulator")).json() == {"enabled": False}

    response = await client.put("/api/v1/simulator", json={"enabled": True})
    assert response.status_code == 200
    assert response.json() == {"enabled": True}
    assert (await client.get("/api/v1/simulator")).json() == {"enabled": True}


async def test_tick_creates_consistent_orders(
    session_maker: async_sessionmaker[AsyncSession],
    dataset: Dataset,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Very high rate so a single tick surely creates orders.
    monkeypatch.setattr(simulator, "SPEED", 5000.0)
    simulator.set_enabled(True)
    now = utc(2026, 10, 12, 4)  # Monday 09:00 Almaty, morning peak

    async with session_maker() as session:
        created = await simulator.tick(session, now, random.Random(1))
    assert created > 0

    async with session_maker() as session:
        new_orders = (await session.scalars(select(Order).where(Order.created_at == now))).all()
        assert len(new_orders) == created
        assert all(o.status == OrderStatus.preparing for o in new_orders)
        # Numbers continue after the fixture's #1004 without gaps.
        assert sorted(o.number for o in new_orders) == list(range(1005, 1005 + created))
        for order in new_orders:
            total, count = (
                await session.execute(
                    select(func.sum(OrderItem.line_total), func.sum(OrderItem.quantity)).where(
                        OrderItem.order_id == order.id
                    )
                )
            ).one()
            assert (order.total_amount, order.items_count) == (total, count)


async def test_tick_disabled_only_completes_orders(
    session_maker: async_sessionmaker[AsyncSession], dataset: Dataset
) -> None:
    # #1004 (preparing) was created at 2026-10-11 06:00 UTC.
    async with session_maker() as session:
        created = await simulator.tick(session, utc(2026, 10, 11, 6, 1), random.Random(1))
    assert created == 0
    async with session_maker() as session:
        order = await session.get(Order, dataset.order_ids[3])
        assert order is not None
        assert order.status == OrderStatus.preparing  # 1 minute is too early

    async with session_maker() as session:
        await simulator.tick(session, utc(2026, 10, 11, 6) + timedelta(minutes=5), random.Random(1))
    async with session_maker() as session:
        order = await session.get(Order, dataset.order_ids[3])
        assert order is not None
        assert order.status == OrderStatus.completed
        total = await session.scalar(select(func.count(Order.id)))
        assert total == 4
