from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import User, Customer, Payment, RoleEnum, PaymentMethodEnum, PaymentStatusEnum
from app.api.deps import get_current_active_admin
from datetime import datetime

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    
    total_customers = db.query(Customer).count()
    active_customers = db.query(User).filter(User.role == RoleEnum.CUSTOMER, User.is_active == True).count()
    
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == PaymentStatusEnum.PAID).scalar() or 0.0
    
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    
    monthly_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatusEnum.PAID,
        Payment.month == current_month,
        Payment.year == current_year
    ).scalar() or 0.0
    
    pending_payments = db.query(func.sum(Payment.amount)).filter(Payment.status == PaymentStatusEnum.PENDING).scalar() or 0.0
    
    cash_payments = db.query(func.sum(Payment.amount)).filter(Payment.payment_method == PaymentMethodEnum.CASH).scalar() or 0.0
    online_payments = db.query(func.sum(Payment.amount)).filter(Payment.payment_method == PaymentMethodEnum.ONLINE).scalar() or 0.0
    
    return {
        "totalCustomers": total_customers,
        "activeCustomers": active_customers,
        "totalRevenue": total_revenue,
        "monthlyRevenue": monthly_revenue,
        "pendingPayments": pending_payments,
        "cashPayments": cash_payments,
        "onlinePayments": online_payments
    }
