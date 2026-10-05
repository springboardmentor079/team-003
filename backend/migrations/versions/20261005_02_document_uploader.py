"""Track document uploader and file metadata.

Revision ID: 20261005_02
Revises: 20261005_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20261005_02"
down_revision = "20261005_01"
branch_labels = None
depends_on = None

def upgrade():
    inspector = sa.inspect(op.get_bind())
    present = {column["name"] for column in inspector.get_columns("documents")}
    foreign_keys = {tuple(key["constrained_columns"]) for key in inspector.get_foreign_keys("documents")}
    with op.batch_alter_table("documents") as batch:
        if "uploaded_by_id" not in present: batch.add_column(sa.Column("uploaded_by_id", sa.Integer(), nullable=True))
        if "original_filename" not in present: batch.add_column(sa.Column("original_filename", sa.String(length=255), nullable=True))
        if "content_type" not in present: batch.add_column(sa.Column("content_type", sa.String(length=150), nullable=True))
        if "file_size" not in present: batch.add_column(sa.Column("file_size", sa.Integer(), nullable=True))
        if ("uploaded_by_id",) not in foreign_keys:
            batch.create_foreign_key("fk_documents_uploaded_by_id_users", "users", ["uploaded_by_id"], ["id"])

def downgrade():
    # Keep document metadata on downgrade to avoid removing attribution/data.
    pass
