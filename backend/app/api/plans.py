from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Plan, User
from app.schemas.schemas import PlanCreate, PlanResponse
from app.api.deps import get_current_active_admin, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).all()
    return plans

@router.post("/", response_model=PlanResponse)
def create_plan(plan_in: PlanCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_plan = Plan(**plan_in.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)):
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(db_plan)
    db.commit()
    return {"message": "Plan deleted successfully"}
