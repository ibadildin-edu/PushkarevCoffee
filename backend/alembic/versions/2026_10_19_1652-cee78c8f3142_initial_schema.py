"""initial schema

Revision ID: cee78c8f3142
Revises: 
Create Date: 2026-10-19 16:52:12.133572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'cee78c8f3142'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

order_status = postgresql.ENUM(
    "preparing", "completed", "cancelled", name="order_status", create_type=False
)


def upgrade() -> None:
    """Upgrade schema."""
    order_status.create(op.get_bind(), checkfirst=True)
    op.create_table('categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
    sa.Column('color', sa.String(length=7), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_categories')),
    sa.UniqueConstraint('name', name=op.f('uq_categories_name')),
    sa.UniqueConstraint('slug', name=op.f('uq_categories_slug'))
    )
    op.create_table('locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('address', sa.String(length=255), nullable=False),
    sa.Column('opened_at', sa.Date(), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_locations')),
    sa.UniqueConstraint('name', name=op.f('uq_locations_name')),
    sa.UniqueConstraint('slug', name=op.f('uq_locations_slug'))
    )
    op.create_table('orders',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('number', sa.Integer(), nullable=False),
    sa.Column('location_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('status', order_status, nullable=False),
    sa.Column('total_amount', sa.Integer(), nullable=False),
    sa.Column('items_count', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], name=op.f('fk_orders_location_id_locations')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_orders')),
    sa.UniqueConstraint('number', name=op.f('uq_orders_number'))
    )
    op.create_index('ix_orders_created_at', 'orders', ['created_at'], unique=False)
    op.create_index('ix_orders_location_id_created_at', 'orders', ['location_id', 'created_at'], unique=False)
    op.create_index('ix_orders_status', 'orders', ['status'], unique=False)
    op.create_table('products',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('price', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('price > 0', name=op.f('ck_products_price_positive')),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_products_category_id_categories')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_products')),
    sa.UniqueConstraint('name', name=op.f('uq_products_name'))
    )
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)
    op.create_table('order_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_id', sa.Integer(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('unit_price', sa.Integer(), nullable=False),
    sa.Column('line_total', sa.Integer(), nullable=False),
    sa.CheckConstraint('quantity > 0', name=op.f('ck_order_items_quantity_positive')),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], name=op.f('fk_order_items_order_id_orders'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], name=op.f('fk_order_items_product_id_products'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_order_items'))
    )
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_order_items_product_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_table('order_items')
    op.drop_index(op.f('ix_products_category_id'), table_name='products')
    op.drop_table('products')
    op.drop_index('ix_orders_status', table_name='orders')
    op.drop_index('ix_orders_location_id_created_at', table_name='orders')
    op.drop_index('ix_orders_created_at', table_name='orders')
    op.drop_table('orders')
    op.drop_table('locations')
    op.drop_table('categories')
    order_status.drop(op.get_bind(), checkfirst=True)
