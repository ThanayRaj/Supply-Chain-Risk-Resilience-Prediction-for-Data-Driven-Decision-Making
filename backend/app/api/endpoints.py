"""
API Endpoints Router.
Exposes REST endpoints for prediction, decision support, what-if scenarios, analytics, and model governance.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.services.predictor import predictor
from backend.app.services.decision_engine import decision_engine
from backend.app.services.scenario_simulator import scenario_simulator
from backend.app.services.analytics import analytics_service

router = APIRouter(prefix="/api", tags=["Supply Chain Intelligence"])

class PredictionRequest(BaseModel):
    Scheduled_Shipping_Days: float = Field(2.0, ge=0.0, le=10.0, description="Scheduled shipment transit days")
    Shipping_Mode: str = Field("Standard Class", alias="Shipping Mode", description="Shipping carrier tier")
    Department_Name: str = Field("Apparel", alias="Department Name", description="Product department")
    Market: str = Field("Europe", description="Fulfillment destination market")
    Customer_Segment: str = Field("Consumer", alias="Customer Segment", description="Customer segment")
    Supplier_Name: Optional[str] = Field(None, alias="Supplier_Name", description="Assigned supplier hub")
    Product_Price: float = Field(120.0, ge=1.0, description="Unit product price USD")
    Order_Item_Quantity: int = Field(2, ge=1, description="Quantity ordered")
    Sales_Per_Customer: Optional[float] = Field(None, description="Total order sales USD")
    Order_Item_Profit_Ratio: float = Field(0.12, ge=-1.0, le=1.0, alias="Order Item Profit Ratio", description="Net margin ratio")
    Order_Item_Discount_Rate: float = Field(0.05, ge=0.0, le=1.0, alias="Order_Item_Discount_Rate", description="Promotional discount applied")

    model_config = {
        "populate_by_name": True
    }

class WhatIfRequest(BaseModel):
    baseline: PredictionRequest
    modified: PredictionRequest

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Supply Chain Risk & Resilience Intelligence API",
        "model_loaded": predictor.model is not None,
        "selected_model": predictor.metrics.get("selected_model") if predictor.metrics else None
    }

@router.get("/overview")
def get_overview():
    return analytics_service.get_overview()

@router.get("/analytics/risk")
def get_risk_analytics():
    return analytics_service.get_risk_analytics()

@router.get("/analytics/resilience")
def get_resilience_analytics():
    return analytics_service.get_resilience_analytics()

@router.get("/analytics/suppliers")
def get_suppliers(
    search: Optional[str] = Query(None, description="Search by supplier name"),
    risk_filter: Optional[str] = Query(None, description="Filter by risk tier (ALL, HIGH, MODERATE, LOW)")
):
    return analytics_service.get_suppliers(search=search, risk_filter=risk_filter)

@router.get("/analytics/logistics")
def get_logistics():
    return analytics_service.get_logistics()

@router.get("/model/performance")
def get_model_performance():
    if predictor.metrics is None:
        predictor.load_artifacts()
    if predictor.metrics is None:
        raise HTTPException(status_code=500, detail="Model metrics unavailable.")
    return predictor.metrics

@router.post("/predict")
def predict_order_risk(payload: PredictionRequest):
    input_dict = payload.model_dump(by_alias=True)
    try:
        prediction = predictor.predict(input_dict)
        recommendations = decision_engine.generate_recommendations(prediction, input_dict)
        prediction["recommendations"] = recommendations
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/what-if")
def simulate_scenario(payload: WhatIfRequest):
    baseline_dict = payload.baseline.model_dump(by_alias=True)
    modified_dict = payload.modified.model_dump(by_alias=True)
    try:
        result = scenario_simulator.simulate(baseline_dict, modified_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.get("/data/sample")
def get_sample_orders(
    limit: int = Query(25, ge=1, le=100),
    risk: Optional[str] = Query(None, description="Filter by risk category")
):
    return analytics_service.get_sample_orders(limit=limit, risk=risk)
