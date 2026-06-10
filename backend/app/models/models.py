from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"

class PaymentMethodEnum(str, enum.Enum):
    CASH = "CASH"
    ONLINE = "ONLINE"

class PaymentStatusEnum(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.CUSTOMER)
    is_active = Column(Boolean, default=True)
    blocked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="user", uselist=False)

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration_months = Column(Integer, default=1)
    features = Column(String, nullable=True) # Stored as JSON string or comma separated
    status = Column(Boolean, default=True)
    
    customers = relationship("Customer", back_populates="plan", foreign_keys="[Customer.plan_id]")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    join_date = Column(DateTime, default=datetime.utcnow)
    monthly_amount = Column(Float, default=0.0)
    aadhar_number = Column(String, nullable=True)
    aadhar_verified = Column(Boolean, default=False)
    requested_plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    
    user = relationship("User", back_populates="customer")
    plan = relationship("Plan", back_populates="customers", foreign_keys=[plan_id])
    requested_plan = relationship("Plan", foreign_keys=[requested_plan_id])
    payments = relationship("Payment", back_populates="customer")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethodEnum), nullable=False)
    transaction_id = Column(String, nullable=True)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING)
    date = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="payments")
