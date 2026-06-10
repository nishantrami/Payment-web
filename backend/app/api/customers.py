from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Customer, User, RoleEnum
from app.schemas.schemas import CustomerResponse, CustomerCreate, CustomerUpdate
from app.api.deps import get_current_active_admin, get_current_active_user
from sqlalchemy import or_

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.mobile_number.ilike(f"%{search}%")
            )
        )
    customers = query.offset(skip).limit(limit).all()
    return customers

@router.get("/profile/me", response_model=CustomerResponse)
def get_customer_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != RoleEnum.CUSTOMER:
        raise HTTPException(status_code=403, detail="Not a customer")
    db_customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return db_customer

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Restrict customer to only see their own profile
    if current_user.role == RoleEnum.CUSTOMER and db_customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_in: CustomerUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/profile/me", response_model=CustomerResponse)
def update_customer_me(customer_in: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != RoleEnum.CUSTOMER:
        raise HTTPException(status_code=403, detail="Not a customer")
    db_customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
        
    update_data = customer_in.model_dump(exclude_unset=True)
    
    # Intercept plan_id changes to push to requested_plan_id instead
    if "plan_id" in update_data and update_data["plan_id"] != db_customer.plan_id:
        new_plan_id = update_data.pop("plan_id")
        db_customer.requested_plan_id = new_plan_id

    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.post("/{customer_id}/approve-plan")
def approve_plan_request(customer_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if not db_customer.requested_plan_id:
        raise HTTPException(status_code=400, detail="No pending plan request")
        
    db_customer.plan_id = db_customer.requested_plan_id
    db_customer.requested_plan_id = None
    db.commit()
    return {"message": "Plan change approved"}

@router.post("/{customer_id}/reject-plan")
def reject_plan_request(customer_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if not db_customer.requested_plan_id:
        raise HTTPException(status_code=400, detail="No pending plan request")
        
    db_customer.requested_plan_id = None
    db.commit()
    return {"message": "Plan change rejected"}

@router.delete("/profile/me")
def delete_customer_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != RoleEnum.CUSTOMER:
        raise HTTPException(status_code=403, detail="Not a customer")
    
    db_customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if db_customer:
        db.delete(db_customer)
        
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    user = db.query(User).filter(User.id == db_customer.user_id).first()
    
    db.delete(db_customer)
    if user:
        db.delete(user)
        
    db.commit()
    return {"message": "Customer deleted successfully"}
