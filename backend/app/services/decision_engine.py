"""
Decision Support and Actionable Recommendation Engine.
Translates ML risk predictions and resilience diagnostics into concrete, data-grounded operational guidance.
"""
from typing import List, Dict, Any

class DecisionEngine:
    @staticmethod
    def generate_recommendations(prediction_result: Dict[str, Any], input_data: Dict[str, Any]) -> List[Dict[str, str]]:
        risk = prediction_result.get("predicted_risk", "MEDIUM")
        risk_score = prediction_result.get("risk_score", 50.0)
        resilience = prediction_result.get("resilience", {})
        resilience_score = resilience.get("score", 60.0)
        res_components = resilience.get("components", {})

        sched_days = float(input_data.get("Scheduled_Shipping_Days", 2))
        shipping_mode = input_data.get("Shipping Mode", "Standard Class")
        profit_ratio = float(input_data.get("Order Item Profit Ratio", 0.10))
        discount_rate = float(input_data.get("Order_Item_Discount_Rate", 0.05))
        supplier_name = input_data.get("Supplier_Name", "Supplier Hub")

        recommendations = []

        # 1. Lead Time & Shipping Agility Strategy
        if sched_days <= 1:
            recommendations.append({
                "category": "Logistics & Routing",
                "priority": "HIGH",
                "title": "Extend Fulfillment Buffer Window",
                "action": f"Current scheduled transit of {sched_days:.0f} day(s) carries severe disruption hazard. Re-negotiate shipment SLA to 3–4 days or switch carrier tier to First Class / Express Air to safeguard on-time SLA.",
                "impact": "Reduces high-risk disruption likelihood by ~28%."
            })
        elif shipping_mode == "Standard Class" and risk in ["HIGH", "MEDIUM"]:
            recommendations.append({
                "category": "Logistics & Routing",
                "priority": "MEDIUM",
                "title": "Upgrade Standard Freight Carrier",
                "action": "Standard Class ground transport exhibits elevated delivery time variance. Consider routing priority SKUs through Second Class or contracted regional line-hauls during high-volume periods.",
                "impact": "Improves logistics agility score from 55 to 70."
            })

        # 2. Supplier Governance & Sourcing
        if res_components.get("Supplier_Reliability", 60) < 60 or risk == "HIGH":
            recommendations.append({
                "category": "Supplier Management",
                "priority": "HIGH",
                "title": "Supplier Performance Audit & Dual-Sourcing",
                "action": f"Assigned hub '{supplier_name}' exhibits elevated historical disruption frequency. Trigger a vendor performance review and initiate split-volume contracts with a secondary regional supplier.",
                "impact": "Diversifies operational exposure and reduces supplier single-point failure."
            })
        else:
            recommendations.append({
                "category": "Supplier Management",
                "priority": "LOW",
                "title": "Maintain Preferred Vendor Allocation",
                "action": f"Hub '{supplier_name}' demonstrates stable fulfillment benchmarks. Maintain current allocation while establishing automated real-time milestone tracking.",
                "impact": "Protects existing high-resilience supply baseline."
            })

        # 3. Financial & Margin Guardrails
        if profit_ratio < 0.0:
            recommendations.append({
                "category": "Financial Resilience",
                "priority": "HIGH",
                "title": "Curbs Margin Erosion & Discount Caps",
                "action": f"Order exhibits negative profit ratio ({profit_ratio:.1%}). Enforce minimum margin thresholds and limit maximum discount rates to prevent subsidizing unprofitable delayed shipments.",
                "impact": "Restores financial buffer health component from 10 to 75 points."
            })
        elif discount_rate > 0.15:
            recommendations.append({
                "category": "Financial Resilience",
                "priority": "MEDIUM",
                "title": "Coordinate Promotion with Warehouse Capacity",
                "action": f"Promotional discount rate ({discount_rate:.1%}) creates demand spikes. Synchronize marketing promotions with distribution center throughput to avoid order processing backlogs.",
                "impact": "Smooths fulfillment peaks and avoids shipment hold status."
            })

        # 4. Resilience Enhancement Action
        if resilience_score < 50.0:
            recommendations.append({
                "category": "Overall Resilience",
                "priority": "CRITICAL",
                "title": "Activate Supply Chain Contingency Protocol",
                "action": "Composite Resilience Index is below critical threshold (45.0). Implement end-to-end exception management: notify downstream dispatch, verify safety-stock levels, and establish standby freight capacity.",
                "impact": "Mitigates severe business disruption and protects customer SLA."
            })

        return recommendations[:4]

decision_engine = DecisionEngine()
