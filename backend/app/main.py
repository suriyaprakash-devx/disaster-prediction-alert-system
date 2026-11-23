import os
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.logger import logger
from app.database import engine, Base, check_db_health
import app.models  # Ensure all models are registered on Base.metadata

from app.routers import auth, documents, knowledge, invoices, agents, approvals, products, analytics

# Create database tables automatically if not using manual migrations
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified and initialized.")
except Exception as e:
    logger.error(f"Error during database startup table creation: {str(e)}")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Enterprise Knowledge & Business Automation Copilot with Groq LLM, RAG, and LangGraph",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Allows configured frontend domains, localhost for dev, and Render subdomains
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured Request / Response Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} ({process_time:.2f}ms)"
        )
        return response
    except Exception as exc:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)} ({process_time:.2f}ms)")
        # Never leak stack traces to client in production
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please contact the administrator."}
        )

# Root Endpoint
@app.get("/", tags=["General"])
def root():
    return {
        "service": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Health Check Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    db_healthy = check_db_health()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "environment": settings.APP_ENV,
        "database": "connected" if db_healthy else "disconnected",
        "groq_configured": bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("replace_")),
        "storage_provider": settings.STORAGE_PROVIDER
    }

# Register API Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(knowledge.router)
app.include_router(invoices.router)
app.include_router(agents.router)
app.include_router(approvals.router)
app.include_router(products.router)
app.include_router(analytics.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
