from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.category import CategoryShort
from app.schemas.common import ORMModel

ProductName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Price = Annotated[int, Field(gt=0, description="Price in whole tenge")]


class ProductCreate(BaseModel):
    name: ProductName
    category_id: int
    price: Price
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: ProductName | None = None
    category_id: int | None = None
    price: Price | None = None
    is_active: bool | None = None


class ProductRead(ORMModel):
    id: int
    name: str
    price: int
    is_active: bool
    category_id: int
    category: CategoryShort
    created_at: datetime
    updated_at: datetime
