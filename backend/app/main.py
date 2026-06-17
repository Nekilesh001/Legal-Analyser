from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth_router, contract_router, analysis_router, chat_router, analytics_router, admin_router
from app.config import settings

app = FastAPI(title="LexClarity API", version="1.0.0")

origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(contract_router.router, prefix="/contracts", tags=["contracts"])
app.include_router(analysis_router.router, prefix="/analysis", tags=["analysis"])
app.include_router(chat_router.router, prefix="/chat", tags=["chat"])
app.include_router(analytics_router.router, prefix="/analytics", tags=["analytics"])
app.include_router(admin_router.router, prefix="/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to LexClarity API"}
