from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database

# Routers
from app.routers import (
    auth, projects, resources, inventory, workforce, procurement, notifications, analytics, reports
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto seed database on initial launch if empty
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack Construction Project Management & Site Monitoring Platform Backend APIs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(workforce.router, prefix=settings.API_V1_STR)
app.include_router(procurement.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "documentation": "/docs",
        "redoc": "/redoc",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "healthy"}
