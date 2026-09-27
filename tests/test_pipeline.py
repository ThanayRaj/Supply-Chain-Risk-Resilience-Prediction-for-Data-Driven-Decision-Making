"""
Automated Test Suite for Supply Chain Risk & Resilience Pipeline.
Tests data transformations, resilience indexing, model inference, decision engine, and API endpoints.
"""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
import numpy as np

from backend.app.main import app
from backend.app.services.predictor import predictor
from backend.app.services.decision_engine import decision_engine
from backend.app.services.scenario_simulator import scenario_simulator

client = TestClient(app)

def test_data_and_model_artifacts_exist():
    clean_csv = Path("data/processed/supply_chain_clean.csv")
    model_file = Path("models/best_model.joblib")
    preprocessor_file = Path("models/preprocessor.joblib")
    metrics_file = Path("models/model_metrics.json")

    assert clean_csv.exists(), "Cleaned dataset supply_chain_clean.csv must exist."
    assert model_file.exists(), "Trained model best_model.joblib must exist."
    assert preprocessor_file.exists(), "Preprocessor artifact preprocessor.joblib must exist."
    assert metrics_file.exists(), "Model metrics model_metrics.json must exist."

def test_resilience_score_calculation():
    # Test high resilience scenario
    res_high = predictor.compute_resilience_score(
        scheduled_days=4.0,
        shipping_mode="First Class",
        profit_ratio=0.25,
        supplier_risk_rate=0.20
    )
    assert 0.0 <= res_high["score"] <= 100.0
    assert res_high["category"] in ["LOW", "MODERATE", "HIGH"]
    assert res_high["score"] >= 70.0

    # Test low resilience scenario
    res_low = predictor.compute_resilience_score(
        scheduled_days=0.5,
        shipping_mode="Standard Class",
        profit_ratio=-0.25,
        supplier_risk_rate=0.75
    )
    assert 0.0 <= res_low["score"] <= 100.0
    assert res_low["category"] in ["LOW", "MODERATE", "HIGH"]
    assert res_low["score"] < 50.0

def test_predictor_service_inference():
    sample_input = {
        "Scheduled_Shipping_Days": 1.0,
        "Shipping Mode": "Standard Class",
        "Department Name": "Apparel",
        "Market": "Europe",
        "Customer Segment": "Consumer",
        "Product_Price": 120.0,
        "Order_Item_Quantity": 2,
        "Order Item Profit Ratio": -0.15,
        "Order_Item_Discount_Rate": 0.10
    }

    result = predictor.predict(sample_input)
    assert result["predicted_risk"] in ["LOW", "MEDIUM", "HIGH"]
    assert "risk_probabilities" in result
    
    probs = result["risk_probabilities"]
    assert len(probs) == 3
    total_prob = sum(probs.values())
    assert abs(total_prob - 1.0) < 0.05, f"Probabilities must sum to ~1.0, got {total_prob}"

    assert len(result["key_factors"]) >= 2
    assert "resilience" in result

def test_decision_engine_recommendations():
    prediction_result = {
        "predicted_risk": "HIGH",
        "risk_score": 65.0,
        "resilience": {
            "score": 42.0,
            "category": "LOW",
            "components": {
                "Lead_Time_Buffer": 25.0,
                "Supplier_Reliability": 45.0,
                "Logistics_Agility": 55.0,
                "Financial_Buffer": 10.0
            }
        }
    }
    input_data = {
        "Scheduled_Shipping_Days": 1.0,
        "Shipping Mode": "Standard Class",
        "Order Item Profit Ratio": -0.15,
        "Order_Item_Discount_Rate": 0.20,
        "Supplier_Name": "Apex Global Supply [Apparel - Europe]"
    }

    recs = decision_engine.generate_recommendations(prediction_result, input_data)
    assert len(recs) >= 2
    for r in recs:
        assert "category" in r
        assert "priority" in r
        assert "title" in r
        assert "action" in r
        assert "impact" in r

def test_scenario_simulator():
    baseline = {
        "Scheduled_Shipping_Days": 1.0,
        "Shipping Mode": "Standard Class",
        "Department Name": "Apparel",
        "Market": "Europe",
        "Customer Segment": "Consumer",
        "Product_Price": 100.0,
        "Order_Item_Quantity": 2,
        "Order Item Profit Ratio": -0.10,
        "Order_Item_Discount_Rate": 0.15
    }
    modified = {
        **baseline,
        "Scheduled_Shipping_Days": 4.0,
        "Shipping Mode": "First Class",
        "Order Item Profit Ratio": 0.20,
        "Order_Item_Discount_Rate": 0.05
    }

    sim = scenario_simulator.simulate(baseline, modified)
    assert "baseline" in sim
    assert "simulated" in sim
    assert "deltas" in sim
    assert "resilience_score_delta" in sim["deltas"]
    assert sim["deltas"]["resilience_score_delta"] > 0

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_api_overview():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_records"] >= 1000
    assert "risk_distribution" in data
    assert "resilience_distribution" in data

def test_api_predict():
    payload = {
        "Scheduled_Shipping_Days": 3.0,
        "Shipping Mode": "Second Class",
        "Department Name": "Golf",
        "Market": "LATAM",
        "Customer Segment": "Corporate",
        "Product_Price": 85.0,
        "Order_Item_Quantity": 4,
        "Order Item Profit Ratio": 0.18,
        "Order_Item_Discount_Rate": 0.02
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_risk"] in ["LOW", "MEDIUM", "HIGH"]
    assert len(data["recommendations"]) >= 1

def test_api_what_if():
    payload = {
        "baseline": {
            "Scheduled_Shipping_Days": 1.0,
            "Shipping Mode": "Standard Class",
            "Department Name": "Apparel",
            "Market": "Europe",
            "Customer Segment": "Consumer",
            "Product_Price": 120.0,
            "Order_Item_Quantity": 2,
            "Order Item Profit Ratio": -0.05,
            "Order_Item_Discount_Rate": 0.10
        },
        "modified": {
            "Scheduled_Shipping_Days": 3.0,
            "Shipping Mode": "Second Class",
            "Department Name": "Apparel",
            "Market": "Europe",
            "Customer Segment": "Consumer",
            "Product_Price": 120.0,
            "Order_Item_Quantity": 2,
            "Order Item Profit Ratio": 0.15,
            "Order_Item_Discount_Rate": 0.05
        }
    }
    res = client.post("/api/what-if", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "deltas" in data
    assert "shift_summary" in data["deltas"]
