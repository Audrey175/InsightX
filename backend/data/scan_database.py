import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./insightx.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def _ensure_scan_columns() -> None:
    # Only applies to SQLite
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(scans)").fetchall()
        # If table doesn't exist yet, nothing to alter
        if not rows:
            return

        existing = {row[1] for row in rows}

        # SQLite limitation:
        # ALTER TABLE ADD COLUMN cannot use non-constant defaults like CURRENT_TIMESTAMP.
        # So we add updated_at without a default and manage it in app code.
        columns = {
            "review_status": "review_status TEXT",
            "clinician_note": "clinician_note TEXT",
            "updated_at": "updated_at DATETIME",
        }

        for name, ddl in columns.items():
            if name not in existing:
                conn.exec_driver_sql(f"ALTER TABLE scans ADD COLUMN {ddl}")



def init_db() -> None:
    from backend.models.doctor import Doctor  # noqa
    from backend.models.patient import Patient  # noqa
    from backend.models.scan import Scan  # noqa
    from backend.models.user import User  # noqa
    Base.metadata.create_all(bind=engine)
    _ensure_scan_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
