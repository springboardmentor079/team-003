"""Create vendor, purchase order, and invoice tables.

Revision ID: 20261005_01
Revises:
"""
from alembic import op
from app.database import Base
from app import models  # noqa: F401

revision = "20261005_01"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create only absent tables; existing milestone tables and records are preserved.
    Base.metadata.create_all(bind=op.get_bind())

def downgrade():
    # Deliberately keep data on downgrade; remove these tables manually only after backup.
    pass
