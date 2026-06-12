from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Try to load from local .env file in backend directory
    current_dir = os.path.dirname(os.path.abspath(__file__)) # app/core
    backend_dir = os.path.dirname(os.path.dirname(current_dir)) # backend
    env_path = os.path.join(backend_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    key, val = line.strip().split("=", 1)
                    if key.strip() == "DATABASE_URL":
                        DATABASE_URL = val.strip().strip('"').strip("'")
                        break

if not DATABASE_URL:
    if os.environ.get("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/saas_db_v3.sqlite"
    else:
        DATABASE_URL = "sqlite:///./saas_db_v3.sqlite"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
