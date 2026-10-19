from datetime import UTC, date, datetime, time, timedelta

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
