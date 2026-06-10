from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Payment, User, Customer, RoleEnum
from app.schemas.schemas import PaymentResponse, PaymentCreate
from app.api.deps import get_current_active_admin, get_current_active_user
import io
from fastapi.responses import StreamingResponse
import openpyxl

router = APIRouter()

@router.get("/", response_model=List[PaymentResponse])
def get_payments(customer_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(Payment)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
        
    if current_user.role == RoleEnum.CUSTOMER:
        db_customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        query = query.filter(Payment.customer_id == db_customer.id)
        
    return query.all()

@router.post("/", response_model=PaymentResponse)
def add_payment(payment_in: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    
    # Check permissions
    if current_user.role == RoleEnum.CUSTOMER:
        db_customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if payment_in.customer_id != db_customer.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
    db_payment = Payment(**payment_in.model_dump())
    
    # Customers can only create PENDING payments
    if current_user.role == RoleEnum.CUSTOMER:
        db_payment.status = "PENDING"
        
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.put("/{payment_id}/approve", response_model=PaymentResponse)
def approve_payment(payment_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    db_payment.status = "PAID"
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.delete("/{payment_id}")
def reject_payment(payment_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    db.delete(db_payment)
    db.commit()
    return {"message": "Payment rejected and deleted"}

@router.get("/export")
def export_payments(db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    payments = db.query(Payment).all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Payments"
    ws.append(["ID", "Customer ID", "Month", "Year", "Amount", "Method", "Status", "Date"])
    
    for p in payments:
        ws.append([p.id, p.customer_id, p.month, p.year, p.amount, p.payment_method.value, p.status.value, p.date.strftime("%Y-%m-%d")])
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    return StreamingResponse(
        stream, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers={"Content-Disposition": "attachment; filename=payments_export.xlsx"}
    )
