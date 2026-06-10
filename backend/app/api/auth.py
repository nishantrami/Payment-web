from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.models import User, RoleEnum, Customer
from app.schemas.schemas import Token, UserCreate, UserResponse, CustomerCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        all_users = db.query(User).all()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User {form_data.username} not found. Registered users: {[u.email for u in all_users]}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password verification failed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.blocked_until and user.blocked_until > datetime.utcnow():
        if user.blocked_until.year > 2100:
            raise HTTPException(status_code=403, detail="Your account has been permanently blocked.")
        raise HTTPException(status_code=403, detail=f"Your account is blocked until {user.blocked_until.strftime('%Y-%m-%d')}.")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register/customer", response_model=UserResponse)
def register_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == customer_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create User
    hashed_password = get_password_hash(customer_in.password)
    db_user = User(
        email=customer_in.email,
        hashed_password=hashed_password,
        role=RoleEnum.CUSTOMER
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Aadhar validation removed per user request

    # Create Customer Profile
    db_customer = Customer(
        user_id=db_user.id,
        full_name=customer_in.full_name,
        mobile_number=customer_in.mobile_number,
        address=customer_in.address,
        plan_id=customer_in.plan_id,
        monthly_amount=customer_in.monthly_amount,
        aadhar_number=customer_in.aadhar_number,
        aadhar_verified=bool(customer_in.aadhar_number)  # Simple assumption for now
    )
    db.add(db_customer)
    db.commit()
    
    return db_user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
