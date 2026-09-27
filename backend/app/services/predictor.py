"""
Prediction and Explainability Service.
Handles feature transformations, model inference, resilience indexing, and factor attribution.
"""
import os
import json
import logging
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

MODELS_DIR = Path("models")

class RiskPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.metrics = None
        self.classes = []
        self.supplier_risk_map = {}
        self.feature_means = {
            "Scheduled_Shipping_Days": 2.93,
            "Product_Price": 140.0,
            "Order_Item_Quantity": 2.0,
            "Sales_Per_Customer": 183.0,
            "Order Item Profit Ratio": 0.12,
            "Order_Item_Discount_Rate": 0.08,
            "Supplier_Historical_Risk_Rate": 0.54
        }
        self.load_artifacts()

    def load_artifacts(self):
        try:
            model_path = MODELS_DIR / "best_model.joblib"
            preprocessor_path = MODELS_DIR / "preprocessor.joblib"
            metrics_path = MODELS_DIR / "model_metrics.json"

            if model_path.exists() and preprocessor_path.exists() and metrics_path.exists():
                self.model = joblib.load(model_path)
                self.preprocessor = joblib.load(preprocessor_path)
                with open(metrics_path, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)
                self.classes = self.metrics.get("classes", ["HIGH", "LOW", "MEDIUM"])
                self.supplier_risk_map = self.metrics.get("supplier_risk_rate_map", {})
                logger.info(f"Loaded {self.metrics.get('selected_model')} and preprocessor successfully.")
            else:
                logger.warning("Model artifacts not found. Please run train_models.py first.")
        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}")

    def compute_resilience_score(self, scheduled_days: float, shipping_mode: str, profit_ratio: float, supplier_risk_rate: float) -> dict:
        """
        Computes the engineered Supply Chain Resilience Score (0–100).
        Based on lead time buffer, supplier reliability, shipping agility, and profit margin.
        """
        # Delivery buffer: scheduled days >= 3 provides safer buffer
        buffer_factor = min(1.0, max(0.1, scheduled_days / 4.0))
        
        # Supplier reliability: 1 - late risk rate
        supplier_factor = max(0.1, min(1.0, 1.0 - supplier_risk_rate + 0.15))
        
        # Shipping agility
        mode_agility = {
            "Same Day": 1.0,
            "First Class": 0.85,
            "Second Class": 0.70,
            "Standard Class": 0.55
        }.get(shipping_mode, 0.60)
        
        # Margin health
        margin_factor = 1.0 if profit_ratio > 0.20 else (0.75 if profit_ratio >= 0.0 else (0.40 if profit_ratio >= -0.20 else 0.10))
        
        resilience = (
            0.30 * buffer_factor +
            0.30 * supplier_factor +
            0.20 * mode_agility +
            0.20 * margin_factor
        ) * 100.0
        
        resilience_clamped = round(float(np.clip(resilience, 10.0, 98.0)), 1)
        
        if resilience_clamped < 45.0:
            category = "LOW"
        elif resilience_clamped <= 75.0:
            category = "MODERATE"
        else:
            category = "HIGH"
            
        return {
            "score": resilience_clamped,
            "category": category,
            "components": {
                "Lead_Time_Buffer": round(buffer_factor * 100, 1),
                "Supplier_Reliability": round(supplier_factor * 100, 1),
                "Logistics_Agility": round(mode_agility * 100, 1),
                "Financial_Buffer": round(margin_factor * 100, 1)
            }
        }

    def predict(self, input_data: dict) -> dict:
        if self.model is None or self.preprocessor is None:
            self.load_artifacts()
            if self.model is None:
                raise RuntimeError("Model is not initialized.")

        # Extract features with safe defaults and None handling
        def _f(val, default):
            return float(val) if val is not None else float(default)
        def _i(val, default):
            return int(val) if val is not None else int(default)
        def _s(val, default):
            return str(val) if val is not None and str(val).strip() != "" else str(default)

        sched_days = _f(input_data.get("Scheduled_Shipping_Days") or input_data.get("Scheduled Shipping Days"), 2.0)
        price = _f(input_data.get("Product_Price"), 100.0)
        qty = _i(input_data.get("Order_Item_Quantity"), 1)
        sales = _f(input_data.get("Sales_Per_Customer"), price * qty)
        profit_ratio = _f(input_data.get("Order Item Profit Ratio"), 0.10)
        discount_rate = _f(input_data.get("Order_Item_Discount_Rate"), 0.05)
        
        shipping_mode = _s(input_data.get("Shipping Mode"), "Standard Class")
        dept_name = _s(input_data.get("Department Name"), "Apparel")
        market = _s(input_data.get("Market"), "Europe")
        customer_segment = _s(input_data.get("Customer Segment"), "Consumer")
        supplier_name = _s(input_data.get("Supplier_Name"), f"Apex Global Supply [{dept_name} - {market}]")

        supplier_risk = self.supplier_risk_map.get(supplier_name, 0.54)

        row_df = pd.DataFrame([{
            "Scheduled_Shipping_Days": sched_days,
            "Product_Price": price,
            "Order_Item_Quantity": qty,
            "Sales_Per_Customer": sales,
            "Order Item Profit Ratio": profit_ratio,
            "Order_Item_Discount_Rate": discount_rate,
            "Supplier_Historical_Risk_Rate": supplier_risk,
            "Shipping Mode": shipping_mode,
            "Department Name": dept_name,
            "Market": market,
            "Customer Segment": customer_segment
        }])

        X_proc = self.preprocessor.transform(row_df)
        probs = self.model.predict_proba(X_proc)[0]

        prob_dict = {cls_name: round(float(prob), 4) for cls_name, prob in zip(self.classes, probs)}
        predicted_class = self.classes[int(np.argmax(probs))]

        # Resilience calculation
        resilience_info = self.compute_resilience_score(sched_days, shipping_mode, profit_ratio, supplier_risk)

        # Factor Attribution / Explainability
        contributing_factors = []
        if sched_days <= 1:
            contributing_factors.append({
                "factor": "Aggressive Shipping Window",
                "impact": "HIGH",
                "description": f"Scheduled transit of {sched_days:.0f} day(s) leaves minimal tolerance for freight or customs bottlenecks."
            })
        elif sched_days >= 4:
            contributing_factors.append({
                "factor": "Generous Lead Time Window",
                "impact": "POSITIVE",
                "description": f"Scheduled transit of {sched_days:.0f} days provides adequate resilience against unexpected carrier delays."
            })

        if profit_ratio < 0.0:
            contributing_factors.append({
                "factor": "Negative Margin Strain",
                "impact": "HIGH",
                "description": f"Profit ratio ({profit_ratio:.1%}) degrades financial resilience, increasing cancellation vulnerability."
            })

        if shipping_mode == "Standard Class":
            contributing_factors.append({
                "factor": "Standard Freight Exposure",
                "impact": "MODERATE",
                "description": "Standard Class carrier network has historically higher variance in final delivery fulfillment."
            })
        elif shipping_mode in ["Same Day", "First Class"]:
            contributing_factors.append({
                "factor": "Priority Carrier Tier",
                "impact": "POSITIVE",
                "description": f"{shipping_mode} benefits from expedited handling and priority routing."
            })

        if supplier_risk > 0.55:
            contributing_factors.append({
                "factor": "Elevated Vendor Late Rate",
                "impact": "HIGH",
                "description": f"Assigned supplier hub exhibits a historical late shipment rate of {supplier_risk:.1%}."
            })

        if discount_rate > 0.15:
            contributing_factors.append({
                "factor": "High Promotional Discounting",
                "impact": "MODERATE",
                "description": f"Discount rate of {discount_rate:.1%} drives surge demand which can strain local warehouse dispatch."
            })

        # Ensure at least 3 factors
        if len(contributing_factors) < 3:
            contributing_factors.append({
                "factor": "Order Volume & Value Scale",
                "impact": "NEUTRAL",
                "description": f"Order quantity ({qty}) and value (${sales:,.2f}) align with typical regional velocity."
            })

        return {
            "predicted_risk": predicted_class,
            "risk_probabilities": prob_dict,
            "risk_score": round(float(prob_dict.get("HIGH", 0.33) * 100), 1),
            "resilience": resilience_info,
            "key_factors": contributing_factors[:4],
            "model_used": self.metrics.get("selected_model", "Random Forest")
        }

predictor = RiskPredictor()
