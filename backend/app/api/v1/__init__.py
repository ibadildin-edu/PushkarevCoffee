from fastapi import APIRouter

from app.api.v1 import categories, health, locations, orders, products

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(locations.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
