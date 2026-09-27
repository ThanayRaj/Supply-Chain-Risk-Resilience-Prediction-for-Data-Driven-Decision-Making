"""
What-If Scenario Simulation Service.
Enables supply chain planners to simulate parameter modifications (lead time, shipping mode, supplier selection)
and observe exact quantitative shifts in risk probability and resilience score.
"""
from typing import Dict, Any
from backend.app.services.predictor import predictor
from backend.app.services.decision_engine import decision_engine

class ScenarioSimulator:
    @staticmethod
    def simulate(baseline_data: Dict[str, Any], modified_data: Dict[str, Any]) -> Dict[str, Any]:
        baseline_pred = predictor.predict(baseline_data)
        modified_pred = predictor.predict(modified_data)

        base_prob = baseline_pred["risk_probabilities"]
        mod_prob = modified_pred["risk_probabilities"]

        base_resilience = baseline_pred["resilience"]["score"]
        mod_resilience = modified_pred["resilience"]["score"]

        high_risk_prob_delta = round((mod_prob.get("HIGH", 0) - base_prob.get("HIGH", 0)) * 100, 2)
        resilience_delta = round(mod_resilience - base_resilience, 1)

        # Risk shift text
        base_risk = baseline_pred["predicted_risk"]
        mod_risk = modified_pred["predicted_risk"]
        
        if base_risk == mod_risk:
            if high_risk_prob_delta < -2:
                shift_summary = f"Maintained {base_risk} Risk with a favorable {abs(high_risk_prob_delta):.1f}% reduction in disruption likelihood."
            elif high_risk_prob_delta > 2:
                shift_summary = f"Maintained {base_risk} Risk with an unfavorable {high_risk_prob_delta:.1f}% increase in disruption likelihood."
            else:
                shift_summary = f"Risk category remained steady at {base_risk}."
        else:
            if (base_risk == "HIGH" and mod_risk in ["MEDIUM", "LOW"]) or (base_risk == "MEDIUM" and mod_risk == "LOW"):
                shift_summary = f"Successful Risk Mitigation: De-escalated from {base_risk} to {mod_risk} Risk ({abs(high_risk_prob_delta):.1f}% drop in high-risk probability)."
            else:
                shift_summary = f"Risk Escalation: Shifted from {base_risk} to {mod_risk} Risk (+{high_risk_prob_delta:.1f}% higher disruption hazard)."

        # Parameter comparison
        diffs = {}
        for key in modified_data:
            b_val = baseline_data.get(key)
            m_val = modified_data.get(key)
            if b_val != m_val:
                diffs[key] = {"baseline": b_val, "simulated": m_val}

        return {
            "baseline": {
                "predicted_risk": base_risk,
                "probabilities": base_prob,
                "resilience": baseline_pred["resilience"],
                "risk_score": baseline_pred["risk_score"]
            },
            "simulated": {
                "predicted_risk": mod_risk,
                "probabilities": mod_prob,
                "resilience": modified_pred["resilience"],
                "risk_score": modified_pred["risk_score"],
                "recommendations": decision_engine.generate_recommendations(modified_pred, modified_data)
            },
            "deltas": {
                "high_risk_prob_delta_pct": high_risk_prob_delta,
                "resilience_score_delta": resilience_delta,
                "risk_category_shift": f"{base_risk} -> {mod_risk}",
                "shift_summary": shift_summary
            },
            "modified_parameters": diffs
        }

scenario_simulator = ScenarioSimulator()
