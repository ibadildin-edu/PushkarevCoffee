from datetime import date

from sqlalchemy import Date, String, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    address: Mapped[str] = mapped_column(String(255))
    opened_at: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(default=True, server_default=true())
