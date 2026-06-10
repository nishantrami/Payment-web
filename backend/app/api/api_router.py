from fastapi import APIRouter
from app.api import auth, plans, customers, payments, analytics, users, verification

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])

