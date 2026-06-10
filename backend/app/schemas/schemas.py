from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import RoleEnum, PaymentMethodEnum, PaymentStatusEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.CUSTOMER

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime
    blocked_until: Optional[datetime] = None

class UserBlockRequest(BaseModel):
    duration: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class PlanBase(BaseModel):
    name: str
    price: float
    duration_months: int
    features: Optional[str] = None
    status: bool = True

class PlanCreate(PlanBase):
    pass

class PlanResponse(PlanBase):
    id: int

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    full_name: str
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    plan_id: Optional[int] = None
    monthly_amount: float = 0.0
    aadhar_number: Optional[str] = None

class CustomerCreate(CustomerBase):
    email: EmailStr
    password: str

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    plan_id: Optional[int] = None

class CustomerResponse(CustomerBase):
    id: int
    user_id: int
    join_date: datetime
    plan: Optional[PlanResponse] = None
    requested_plan_id: Optional[int] = None
    requested_plan: Optional[PlanResponse] = None

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    customer_id: int
    month: int
    year: int
    amount: float
    payment_method: PaymentMethodEnum
    transaction_id: Optional[str] = None
    status: PaymentStatusEnum = PaymentStatusEnum.PENDING

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True
