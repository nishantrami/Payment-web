from app.core.database import SessionLocal, engine
from app.models.models import Base, Plan

def seed_plans():
    db = SessionLocal()
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
            print(f"Added plan: {p_data['name']}")
        else:
            print(f"Plan already exists: {p_data['name']}")
    
    db.commit()
    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed_plans()
