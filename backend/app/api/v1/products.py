from collections.abc import Sequence

from fastapi import APIRouter, status

from app.api.deps import SessionDep
from app.models import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import products as service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
async def list_products(
    session: SessionDep,
    category_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> Sequence[Product]:
    return await service.list_products(
        session, category_id=category_id, is_active=is_active, search=search
    )


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, session: SessionDep) -> Product:
    return await service.get_product(session, product_id)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, session: SessionDep) -> Product:
    return await service.create_product(session, data)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(product_id: int, data: ProductUpdate, session: SessionDep) -> Product:
    return await service.update_product(session, product_id, data)


@router.delete("/{product_id}", response_model=ProductRead)
async def delete_product(product_id: int, session: SessionDep) -> Product:
    """Soft delete: sets is_active = false and returns the product."""
    return await service.deactivate_product(session, product_id)
