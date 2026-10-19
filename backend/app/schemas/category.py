from app.schemas.common import ORMModel


class CategoryRead(ORMModel):
    id: int
    name: str
    slug: str
    sort_order: int
    color: str


class CategoryShort(ORMModel):
    id: int
    name: str
    color: str
