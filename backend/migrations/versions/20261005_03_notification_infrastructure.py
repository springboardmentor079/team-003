"""Add notification metadata and query indexes.

Revision ID: 20261005_03
Revises: 20261005_02
"""
from alembic import op
import sqlalchemy as sa

revision = "20261005_03"
down_revision = "20261005_02"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("notifications")}
    with op.batch_alter_table("notifications") as batch:
        if "related_entity_type" not in columns:
            batch.add_column(sa.Column("related_entity_type", sa.String(length=50), nullable=True))
        if "related_entity_id" not in columns:
            batch.add_column(sa.Column("related_entity_id", sa.Integer(), nullable=True))

    # Normalize legacy presentation-oriented types into stable domain types.
    bind.execute(sa.text("""
        UPDATE notifications
        SET type = CASE
            WHEN lower(title) LIKE '%procurement%' OR lower(title) LIKE '%purchase order%' THEN 'procurement'
            WHEN lower(title) LIKE '%attendance%' THEN 'attendance'
            WHEN lower(title) LIKE '%deadline%' THEN 'deadline'
            WHEN lower(title) LIKE '%project%' OR lower(title) LIKE '%milestone%' THEN 'project'
            ELSE 'system'
        END
        WHERE type NOT IN ('project', 'task', 'procurement', 'attendance', 'deadline', 'system')
    """))

    existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("notifications")}
    indexes = {
        "ix_notifications_user_id": ["user_id"],
        "ix_notifications_is_read": ["is_read"],
        "ix_notifications_created_at": ["created_at"],
        "ix_notifications_user_read": ["user_id", "is_read"],
        "ix_notifications_user_created": ["user_id", "created_at"],
    }
    for name, columns in indexes.items():
        if name not in existing_indexes:
            op.create_index(name, "notifications", columns, unique=False)


def downgrade():
    # Preserve notification data and metadata on downgrade.
    pass
