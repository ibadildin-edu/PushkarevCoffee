"""Usage: uv run python -m app.seed --days 90 --reset"""

import argparse
import asyncio
import time

from app.db.session import SessionLocal, engine
from app.seed.generator import seed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed CoffeeMetrics demo data.")
    parser.add_argument("--days", type=int, default=90, help="number of days of history")
    parser.add_argument("--reset", action="store_true", help="truncate all tables first")
    parser.add_argument("--seed", type=int, default=42, help="random seed")
    args = parser.parse_args()
    if args.days < 1:
        parser.error("--days must be >= 1")
    return args


async def main() -> None:
    args = parse_args()
    started = time.perf_counter()
    try:
        async with SessionLocal() as session:
            stats = await seed(session, days=args.days, reset=args.reset, random_seed=args.seed)
    finally:
        await engine.dispose()
    elapsed = time.perf_counter() - started
    print(
        f"Seeded {stats.locations} locations, {stats.categories} categories, "
        f"{stats.products} products, {stats.orders} orders, {stats.order_items} order items "
        f"for {args.days} days in {elapsed:.1f}s"
    )


if __name__ == "__main__":
    asyncio.run(main())
