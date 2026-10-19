"""Tests run against a separate database `<db>_test` in the same Postgres container.

The schema is created from model metadata once per session; every test starts with
empty tables plus the small fixture dataset below.
"""

import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, date, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models import Category, Location, Order, OrderItem, OrderStatus, Product

_base_url = make_url(settings.database_url)
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    _base_url.set(database=f"{_base_url.database}_test").render_as_string(hide_password=False),
)


async def _ensure_database(url: str) -> None:
    parsed = make_url(url)
    admin = create_async_engine(parsed.set(database="postgres"), isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        exists = await conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": parsed.database}
        )
        if not exists:
            await conn.execute(text(f'CREATE DATABASE "{parsed.database}"'))
    await admin.dispose()


@pytest.fixture(scope="session")
async def engine() -> AsyncIterator[AsyncEngine]:
    await _ensure_database(TEST_DATABASE_URL)
    test_engine = create_async_engine(TEST_DATABASE_URL)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.execute(text("DROP TYPE IF EXISTS order_status"))
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    await test_engine.dispose()


@pytest.fixture
async def session_maker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE order_items, orders, products, categories, locations "
                "RESTART IDENTITY CASCADE"
            )
        )
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def client(session_maker: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncClient]:
    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@dataclass
class Dataset:
    campus_id: int
    center_id: int
    coffee_id: int
    bakery_id: int
    americano_id: int
    latte_id: int
    croissant_id: int
    order_ids: list[int]


def utc(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(year, month, day, hour, minute, tzinfo=UTC)


@pytest.fixture
async def dataset(session_maker: async_sessionmaker[AsyncSession]) -> Dataset:
    """Two locations, two categories, three products and four orders.

    Order times are in UTC; Asia/Almaty is UTC+5, so 2026-10-10 19:30 UTC is
    already 2026-10-11 00:30 local time.
    """
    async with session_maker() as session:
        campus = Location(name="Кампус", slug="campus", address="a", opened_at=date(2022, 1, 1))
        center = Location(name="Центр", slug="center", address="b", opened_at=date(2022, 1, 1))
        coffee = Category(name="Кофе", slug="coffee", sort_order=1, color="#3B2418")
        bakery = Category(name="Выпечка", slug="bakery", sort_order=2, color="#E5CBA8")
        session.add_all([campus, center, coffee, bakery])
        await session.flush()

        americano = Product(category_id=coffee.id, name="Американо", price=1100)
        latte = Product(category_id=coffee.id, name="Латте", price=1500)
        croissant = Product(category_id=bakery.id, name="Круассан", price=1200)
        session.add_all([americano, latte, croissant])
        await session.flush()

        def make_order(
            number: int,
            location: Location,
            created_at: datetime,
            status: OrderStatus,
            lines: list[tuple[Product, int]],
        ) -> Order:
            items = [
                OrderItem(product_id=p.id, quantity=q, unit_price=p.price, line_total=p.price * q)
                for p, q in lines
            ]
            return Order(
                number=number,
                location_id=location.id,
                created_at=created_at,
                status=status,
                total_amount=sum(i.line_total for i in items),
                items_count=sum(q for _, q in lines),
                items=items,
            )

        orders = [
            # 2026-10-10 local
            make_order(1001, campus, utc(2026, 10, 10, 4), OrderStatus.completed, [(americano, 1)]),
            make_order(
                1002,
                center,
                utc(2026, 10, 10, 9),
                OrderStatus.completed,
                [(latte, 2), (croissant, 1)],
            ),
            # 2026-10-11 local (00:30 Almaty)
            make_order(
                1003, campus, utc(2026, 10, 10, 19, 30), OrderStatus.cancelled, [(latte, 1)]
            ),
            make_order(
                1004,
                campus,
                utc(2026, 10, 11, 6),
                OrderStatus.preparing,
                [(americano, 1), (croissant, 2)],
            ),
        ]
        session.add_all(orders)
        await session.commit()

        return Dataset(
            campus_id=campus.id,
            center_id=center.id,
            coffee_id=coffee.id,
            bakery_id=bakery.id,
            americano_id=americano.id,
            latte_id=latte.id,
            croissant_id=croissant.id,
            order_ids=[o.id for o in orders],
        )
