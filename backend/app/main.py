from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_router import api_router
from app.core.database import engine
from app.models.models import Base
import os

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SaaS Payment & Subscription API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to SaaS Payment API"}
