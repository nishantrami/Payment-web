from app.core.database import SessionLocal, engine
from app.models.models import Base, User, RoleEnum
from app.core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
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
        print("Admin user created (admin@saas.com / admin123)")
    else:
        print("Admin user already exists.")
    db.close()

if __name__ == "__main__":
    init_db()
