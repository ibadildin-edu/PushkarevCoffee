"""Reference data and demand model parameters for the seed generator."""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class LocationSeed:
    slug: str
    name: str
    address: str
    opened_at: date
    # Mean orders per hour at profile weight 1.0 on a weekday-factor 1.0 day.
    base_per_hour: float
    # ISO weekday (1=Mon .. 7=Sun) -> demand multiplier.
    weekday_factor: dict[int, float]
    # Multiplier for hours >= 18 (business district empties in the evening).
    evening_factor: float
    # Probabilities for 1, 2, 3, 4 lines in a basket.
    basket_sizes: tuple[float, float, float, float]
    # >0 favors expensive items, <0 favors cheap ones.
    price_bias: float


@dataclass(frozen=True)
class CategorySeed:
    slug: str
    name: str
    color: str
    # Share of basket lines picked from this category.
    weight: float


@dataclass(frozen=True)
class ProductSeed:
    category: str
    name: str
    price: int
    popularity: float


LOCATIONS: list[LocationSeed] = [
    LocationSeed(
        slug="campus",
        name="Кампус",
        address="г. Алматы, ул. Сатпаева, 22",
        opened_at=date(2022, 9, 1),
        base_per_hour=6.0,
        weekday_factor={1: 1.0, 2: 1.0, 3: 1.05, 4: 1.0, 5: 0.95, 6: 0.55, 7: 0.45},
        evening_factor=1.0,
        basket_sizes=(0.58, 0.29, 0.10, 0.03),
        price_bias=-0.8,
    ),
    LocationSeed(
        slug="center",
        name="Центр",
        address="г. Алматы, пр. Абылай хана, 79",
        opened_at=date(2021, 3, 15),
        base_per_hour=5.1,
        weekday_factor={1: 0.85, 2: 0.85, 3: 0.9, 4: 0.9, 5: 1.05, 6: 1.35, 7: 1.3},
        evening_factor=1.2,
        basket_sizes=(0.42, 0.34, 0.17, 0.07),
        price_bias=0.0,
    ),
    LocationSeed(
        slug="business-center",
        name="Бизнес-центр",
        address="г. Алматы, пр. Аль-Фараби, 77/7",
        opened_at=date(2023, 2, 1),
        base_per_hour=6.6,
        weekday_factor={1: 1.15, 2: 1.15, 3: 1.15, 4: 1.15, 5: 1.1, 6: 0.25, 7: 0.15},
        evening_factor=0.45,
        basket_sizes=(0.36, 0.36, 0.19, 0.09),
        price_bias=0.9,
    ),
]

CATEGORIES: list[CategorySeed] = [
    CategorySeed(slug="coffee", name="Кофе", color="#3B2418", weight=0.60),
    CategorySeed(slug="tea", name="Чай", color="#B08463", weight=0.13),
    CategorySeed(slug="bakery", name="Выпечка", color="#E5CBA8", weight=0.19),
    CategorySeed(slug="desserts", name="Десерты", color="#E8541E", weight=0.08),
]

PRODUCTS: list[ProductSeed] = [
    ProductSeed("coffee", "Эспрессо", 900, 0.5),
    ProductSeed("coffee", "Американо", 1100, 2.0),
    ProductSeed("coffee", "Капучино", 1400, 1.9),
    ProductSeed("coffee", "Латте", 1500, 1.5),
    ProductSeed("coffee", "Раф ванильный", 1700, 0.8),
    ProductSeed("coffee", "Флэт уайт", 1600, 0.7),
    ProductSeed("coffee", "Мокко", 1700, 0.4),
    ProductSeed("coffee", "Колд брю", 1500, 0.35),
    ProductSeed("coffee", "Латте на овсяном", 1800, 0.4),
    ProductSeed("tea", "Чёрный чай", 800, 0.8),
    ProductSeed("tea", "Зелёный чай", 800, 0.6),
    ProductSeed("tea", "Матча-латте", 1800, 1.5),
    ProductSeed("tea", "Облепиховый чай", 1300, 1.0),
    ProductSeed("tea", "Масала-чай", 1500, 0.5),
    ProductSeed("bakery", "Круассан", 1200, 1.6),
    ProductSeed("bakery", "Круассан с миндалём", 1400, 0.6),
    ProductSeed("bakery", "Синнабон", 1400, 1.1),
    ProductSeed("bakery", "Маффин черничный", 900, 0.6),
    ProductSeed("bakery", "Сэндвич с курицей", 2200, 0.7),
    ProductSeed("bakery", "Киш с беконом", 1900, 0.4),
    ProductSeed("desserts", "Чизкейк Сан-Себастьян", 1900, 1.2),
    ProductSeed("desserts", "Тирамису", 2100, 0.7),
    ProductSeed("desserts", "Медовик", 1700, 0.7),
    ProductSeed("desserts", "Брауни", 1100, 0.8),
    ProductSeed("desserts", "Макарон", 500, 0.6),
]

OPEN_HOUR = 7
CLOSE_HOUR = 22  # last hour that still accepts orders (22:00-22:59)

# Relative demand per hour of day: morning peak 8-9, lunch 12-13, evening tail.
HOURLY_PROFILE: dict[int, float] = {
    7: 0.6,
    8: 1.6,
    9: 1.5,
    10: 0.95,
    11: 0.9,
    12: 1.45,
    13: 1.4,
    14: 0.9,
    15: 0.8,
    16: 0.8,
    17: 0.85,
    18: 0.75,
    19: 0.55,
    20: 0.4,
    21: 0.28,
    22: 0.15,
}

CANCEL_RATE = 0.02
# Orders younger than this stay in "preparing".
PREPARING_WINDOW_MINUTES = 5
FIRST_ORDER_NUMBER = 1001
