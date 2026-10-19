from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Category, Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.errors import ConflictError, NotFoundError, ValidationError


async def list_products(
    session: AsyncSession,
    *,
    category_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> Sequence[Product]:
    stmt = (
        select(Product)
        .join(Product.category)
        .options(selectinload(Product.category))
        .order_by(Category.sort_order, Product.name)
    )
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active == is_active)
    if search:
        stmt = stmt.where(Product.name.icontains(search.strip(), autoescape=True))
    return (await session.scalars(stmt)).all()


async def get_product(session: AsyncSession, product_id: int) -> Product:
    product = await session.get(Product, product_id, options=[selectinload(Product.category)])
    if product is None:
        raise NotFoundError(f"Product {product_id} not found")
    return product


async def _ensure_category(session: AsyncSession, category_id: int) -> None:
    if await session.get(Category, category_id) is None:
        raise ValidationError(f"Category {category_id} does not exist")


async def _ensure_unique_name(
    session: AsyncSession, name: str, exclude_id: int | None = None
) -> None:
    stmt = select(Product.id).where(func.lower(Product.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Product.id != exclude_id)
    if await session.scalar(stmt) is not None:
        raise ConflictError(f"Product named '{name}' already exists")


async def _commit_and_reload(session: AsyncSession, product: Product) -> Product:
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError("Product violates a uniqueness constraint") from exc
    await session.refresh(product, attribute_names=["category", "updated_at", "created_at"])
    return product


async def create_product(session: AsyncSession, data: ProductCreate) -> Product:
    await _ensure_category(session, data.category_id)
    await _ensure_unique_name(session, data.name)
    product = Product(**data.model_dump())
    session.add(product)
    return await _commit_and_reload(session, product)


async def update_product(session: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    product = await get_product(session, product_id)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    if "category_id" in changes:
        await _ensure_category(session, changes["category_id"])
    if "name" in changes:
        await _ensure_unique_name(session, changes["name"], exclude_id=product_id)
    for field, value in changes.items():
        setattr(product, field, value)
    return await _commit_and_reload(session, product)


async def deactivate_product(session: AsyncSession, product_id: int) -> Product:
    """Soft delete: order history references products, so they are never removed."""
    product = await get_product(session, product_id)
    product.is_active = False
    return await _commit_and_reload(session, product)
