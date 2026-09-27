"""
FastAPI Main Application Entrypoint.
Initializes FastAPI, configures CORS middleware, mounts endpoints, and defines startup routines.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints import router
from backend.app.services.predictor import predictor
from backend.app.services.analytics import analytics_service

app = FastAPI(
    title="Supply Chain Risk & Resilience Intelligence API",
    description="Enterprise decision-support and predictive intelligence system for supply chain risk mitigation.",
    version="1.0.0"
)

# Enable CORS for local frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "system": "Supply Chain Risk & Resilience Intelligence Platform",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "overview": "/api/overview"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
