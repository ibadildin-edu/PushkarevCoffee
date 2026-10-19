import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.location import Location
    from app.models.product import Product


class OrderStatus(enum.StrEnum):
    preparing = "preparing"
    completed = "completed"
    cancelled = "cancelled"


order_status_enum = Enum(
    OrderStatus,
    name="order_status",
    values_callable=lambda e: [member.value for member in e],
)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_location_id_created_at", "location_id", "created_at"),
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Human-facing order number, shown as "#4863".
    number: Mapped[int] = mapped_column(unique=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[OrderStatus] = mapped_column(order_status_enum)
    # Denormalized totals: sum of line_total and quantity over order_items.
    total_amount: Mapped[int]
    items_count: Mapped[int]

    location: Mapped["Location"] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", passive_deletes=True
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="quantity_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True
    )
    quantity: Mapped[int]
    # Price at the moment of the order, in whole tenge.
    unit_price: Mapped[int]
    line_total: Mapped[int]

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
