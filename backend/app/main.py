from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_router import api_router
from app.core.database import engine, SessionLocal
from app.models.models import Base, User, RoleEnum, Plan
from app.core.security import get_password_hash
import os

# Create DB tables
Base.metadata.create_all(bind=engine)

# Seed database with initial admin and plans
def seed_database():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@saas.com").first()
        if not admin:
            admin_user = User(
                email="admin@saas.com",
                hashed_password=get_password_hash("admin123"),
                role=RoleEnum.ADMIN
            )
            db.add(admin_user)
            db.commit()
            print("Seeded admin user.")

        # Seed plans
        plans_data = [
            {"name": "Silver Channel", "price": 175.0, "duration_months": 1, "features": "Silver theme features"},
            {"name": "Gold Channel", "price": 250.0, "duration_months": 1, "features": "Gold theme features"},
            {"name": "Platinum Channel", "price": 350.0, "duration_months": 1, "features": "Platinum theme features"},
            {"name": "Diamond Channel", "price": 550.0, "duration_months": 1, "features": "Diamond blue theme features"},
            {"name": "Titanium Channel", "price": 750.0, "duration_months": 1, "features": "Titanium gray theme features"},
            {"name": "Crown Channel", "price": 1250.0, "duration_months": 1, "features": "Royal purple and gold theme features"},
        ]
        for p_data in plans_data:
            existing = db.query(Plan).filter(Plan.name == p_data["name"]).first()
            if not existing:
                new_plan = Plan(**p_data)
                db.add(new_plan)
        db.commit()
        print("Seeded plans.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_database()

app = FastAPI(title="SaaS Payment & Subscription API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to SaaS Payment API"}
