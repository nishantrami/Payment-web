from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, RoleEnum
from app.schemas.schemas import UserResponse, UserCreate
from app.core.security import get_password_hash

router = APIRouter()

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    users = db.query(User).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # We should probably handle cascade deletes manually or via ORM relationship.
    # For now, let's just delete the user. The DB schema might not have cascade on delete,
    # so we delete the customer profile first if it exists.
    if user.customer:
        db.delete(user.customer)
        
    db.delete(user)
    db.commit()
    return None

from app.schemas.schemas import UserBlockRequest
from datetime import datetime, timedelta

@router.post("/{user_id}/block", response_model=UserResponse)
def block_user(user_id: int, block_req: UserBlockRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if block_req.duration == "1_month":
        user.blocked_until = datetime.utcnow() + timedelta(days=30)
    elif block_req.duration == "3_months":
        user.blocked_until = datetime.utcnow() + timedelta(days=90)
    elif block_req.duration == "lifetime":
        user.blocked_until = datetime(2999, 12, 31)
    elif block_req.duration == "unblock":
        user.blocked_until = None
    else:
        raise HTTPException(status_code=400, detail="Invalid duration")

    db.commit()
    db.refresh(user)
    return user
