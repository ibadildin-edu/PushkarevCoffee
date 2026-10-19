import re
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import ColumnElement, DateTime, func, literal_column
from sqlalchemy.orm import QueryableAttribute

from app.core.config import settings


def local_today() -> date:
    """Current date in the business time zone (Asia/Almaty)."""
    return datetime.now(settings.tz).date()


def local_day_start_utc(day: date) -> datetime:
    """UTC instant of local midnight for the given local date."""
    return datetime.combine(day, time.min, tzinfo=settings.tz).astimezone(UTC)


def local_range_utc(date_from: date, date_to: date) -> tuple[datetime, datetime]:
    """Half-open UTC range [start, end) covering local dates date_from..date_to inclusive."""
    return local_day_start_utc(date_from), local_day_start_utc(date_to + timedelta(days=1))


def previous_range(date_from: date, date_to: date) -> tuple[date, date]:
    """Range of the same length that ends right before date_from (both inclusive)."""
    days = (date_to - date_from).days + 1
    return date_from - timedelta(days=days), date_from - timedelta(days=1)


# Rendered inline (not as a bind parameter) so that the same expression in SELECT and
# GROUP BY is recognised by Postgres as identical.
if not re.fullmatch(r"[A-Za-z0-9_/+\-]+", settings.tz_name):
    raise ValueError(f"Unsafe time zone name: {settings.tz_name!r}")
_TZ_LITERAL: ColumnElement[str] = literal_column(f"'{settings.tz_name}'")


def local_time(
    column: ColumnElement[datetime] | QueryableAttribute[datetime],
) -> ColumnElement[datetime]:
    """`column AT TIME ZONE 'Asia/Almaty'`: local wall-clock timestamp."""
    return func.timezone(_TZ_LITERAL, column, type_=DateTime())
