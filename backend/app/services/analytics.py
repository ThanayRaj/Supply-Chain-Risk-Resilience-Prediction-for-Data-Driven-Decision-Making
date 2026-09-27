"""
Analytics Service.
Precomputes and provides high-performance aggregates for KPIs, risk heatmaps,
resilience distributions, supplier performance, and logistics intelligence.
"""
import os
import json
import logging
from pathlib import Path
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

DATA_PATH = Path("data/processed/supply_chain_clean.csv")
MODELS_DIR = Path("models")

class AnalyticsService:
    def __init__(self):
        self.df = None
        self.overview_cache = None
        self.risk_cache = None
        self.resilience_cache = None
        self.suppliers_cache = None
        self.logistics_cache = None
        self.load_data()

    def load_data(self):
        if not DATA_PATH.exists():
            logger.warning(f"Data file not found at {DATA_PATH}.")
            return
        
        logger.info("Loading dataset into Analytics Service...")
        self.df = pd.read_csv(DATA_PATH)
        self._compute_all_caches()
        logger.info("Analytics aggregations successfully computed and cached.")

    def _compute_all_caches(self):
        df = self.df
        total_records = len(df)
        high_risk_count = int((df["Supply_Risk_Category"] == "HIGH").sum())
        med_risk_count = int((df["Supply_Risk_Category"] == "MEDIUM").sum())
        low_risk_count = int((df["Supply_Risk_Category"] == "LOW").sum())

        avg_resilience = round(float(df["Resilience_Score"].mean()), 1)
        high_risk_pct = round((high_risk_count / total_records) * 100, 1)

        # Supplier metrics
        supplier_grp = df.groupby("Supplier_Name").agg(
            total_orders=("Order Id", "count"),
            high_risk_orders=("Supply_Risk_Category", lambda s: (s == "HIGH").sum()),
            avg_resilience=("Resilience_Score", "mean"),
            avg_delay=("Delay_Days", "mean")
        ).reset_index()

        supplier_grp["high_risk_pct"] = (supplier_grp["high_risk_orders"] / supplier_grp["total_orders"] * 100).round(1)
        supplier_grp["avg_resilience"] = supplier_grp["avg_resilience"].round(1)
        supplier_grp["avg_delay"] = supplier_grp["avg_delay"].round(2)
        high_risk_suppliers_count = int((supplier_grp["high_risk_pct"] > 30.0).sum())

        potential_disruptions = int((df["Delay_Days"] >= 2).sum() + (df["Delivery Status"] == "Shipping canceled").sum())

        # 1. Overview Cache
        self.overview_cache = {
            "kpis": {
                "total_records": total_records,
                "high_risk_records": high_risk_count,
                "high_risk_percentage": high_risk_pct,
                "average_risk_score": round(high_risk_pct, 1),
                "average_resilience_score": avg_resilience,
                "high_risk_suppliers_count": high_risk_suppliers_count,
                "total_suppliers_count": int(df["Supplier_Name"].nunique()),
                "potential_disruptions": potential_disruptions
            },
            "risk_distribution": [
                {"name": "LOW RISK", "category": "LOW", "count": low_risk_count, "percentage": round(low_risk_count / total_records * 100, 1), "color": "#10B981"},
                {"name": "MEDIUM RISK", "category": "MEDIUM", "count": med_risk_count, "percentage": round(med_risk_count / total_records * 100, 1), "color": "#F59E0B"},
                {"name": "HIGH RISK", "category": "HIGH", "count": high_risk_count, "percentage": round(high_risk_count / total_records * 100, 1), "color": "#EF4444"}
            ],
            "resilience_distribution": [
                {"name": "HIGH (>75)", "category": "HIGH", "count": int((df["Resilience_Category"] == "HIGH").sum()), "percentage": round((df["Resilience_Category"] == "HIGH").mean() * 100, 1), "color": "#10B981"},
                {"name": "MODERATE (45-75)", "category": "MODERATE", "count": int((df["Resilience_Category"] == "MODERATE").sum()), "percentage": round((df["Resilience_Category"] == "MODERATE").mean() * 100, 1), "color": "#F59E0B"},
                {"name": "LOW (<45)", "category": "LOW", "count": int((df["Resilience_Category"] == "LOW").sum()), "percentage": round((df["Resilience_Category"] == "LOW").mean() * 100, 1), "color": "#EF4444"}
            ]
        }

        # 2. Risk Analytics Cache
        # Risk by Department
        dept_risk = df.groupby(["Department Name", "Supply_Risk_Category"]).size().unstack(fill_value=0)
        dept_risk_list = []
        for dept in dept_risk.index:
            total = dept_risk.loc[dept].sum()
            high = int(dept_risk.loc[dept].get("HIGH", 0))
            dept_risk_list.append({
                "department": dept,
                "low": int(dept_risk.loc[dept].get("LOW", 0)),
                "medium": int(dept_risk.loc[dept].get("MEDIUM", 0)),
                "high": high,
                "total": int(total),
                "high_risk_pct": round((high / total) * 100, 1) if total > 0 else 0
            })
        dept_risk_list.sort(key=lambda x: x["high_risk_pct"], reverse=True)

        # Risk by Shipping Mode
        mode_risk = df.groupby(["Shipping Mode", "Supply_Risk_Category"]).size().unstack(fill_value=0)
        mode_risk_list = []
        for mode in mode_risk.index:
            total = mode_risk.loc[mode].sum()
            high = int(mode_risk.loc[mode].get("HIGH", 0))
            mode_risk_list.append({
                "shipping_mode": mode,
                "low": int(mode_risk.loc[mode].get("LOW", 0)),
                "medium": int(mode_risk.loc[mode].get("MEDIUM", 0)),
                "high": high,
                "total": int(total),
                "high_risk_pct": round((high / total) * 100, 1) if total > 0 else 0
            })

        # Risk by Market
        market_risk = df.groupby(["Market", "Supply_Risk_Category"]).size().unstack(fill_value=0)
        market_risk_list = []
        for mkt in market_risk.index:
            total = market_risk.loc[mkt].sum()
            high = int(market_risk.loc[mkt].get("HIGH", 0))
            market_risk_list.append({
                "market": mkt,
                "low": int(market_risk.loc[mkt].get("LOW", 0)),
                "medium": int(market_risk.loc[mkt].get("MEDIUM", 0)),
                "high": high,
                "total": int(total),
                "high_risk_pct": round((high / total) * 100, 1) if total > 0 else 0
            })

        # Risk vs Scheduled Transit Days
        lead_time_risk = df.groupby(["Scheduled_Shipping_Days", "Supply_Risk_Category"]).size().unstack(fill_value=0)
        lead_time_list = []
        for days in sorted(lead_time_risk.index):
            total = lead_time_risk.loc[days].sum()
            high = int(lead_time_risk.loc[days].get("HIGH", 0))
            lead_time_list.append({
                "scheduled_days": int(days),
                "high_risk_pct": round((high / total) * 100, 1) if total > 0 else 0,
                "total_orders": int(total)
            })

        self.risk_cache = {
            "by_department": dept_risk_list,
            "by_shipping_mode": mode_risk_list,
            "by_market": market_risk_list,
            "by_lead_time": lead_time_list
        }

        # 3. Resilience Analytics Cache
        # Histogram of resilience scores
        hist, bin_edges = np.histogram(df["Resilience_Score"], bins=10, range=(20, 100))
        resilience_bins = []
        for count, edge in zip(hist, bin_edges[:-1]):
            resilience_bins.append({
                "range": f"{int(edge)}-{int(edge+8)}",
                "count": int(count)
            })

        # Resilience by Supplier (top 15)
        top_suppliers_res = supplier_grp.sort_values(by="avg_resilience", ascending=False).head(15).to_dict(orient="records")

        self.resilience_cache = {
            "distribution_bins": resilience_bins,
            "top_resilient_suppliers": top_suppliers_res
        }

        # 4. Suppliers Leaderboard
        suppliers_list = supplier_grp.sort_values(by="high_risk_pct", ascending=False).to_dict(orient="records")
        for s in suppliers_list:
            s["resilience_tier"] = "HIGH" if s["avg_resilience"] > 75 else ("MODERATE" if s["avg_resilience"] >= 45 else "LOW")
            s["risk_level"] = "HIGH" if s["high_risk_pct"] > 32 else ("MODERATE" if s["high_risk_pct"] >= 24 else "LOW")
        self.suppliers_cache = suppliers_list

        # 5. Logistics Cache
        logistics_summary = []
        for mode in df["Shipping Mode"].unique():
            sub = df[df["Shipping Mode"] == mode]
            logistics_summary.append({
                "shipping_mode": mode,
                "order_count": int(len(sub)),
                "share_pct": round(len(sub) / total_records * 100, 1),
                "avg_actual_days": round(float(sub["Actual_Shipping_Days"].mean()), 2),
                "avg_scheduled_days": round(float(sub["Scheduled_Shipping_Days"].mean()), 2),
                "avg_delay_days": round(float(sub["Delay_Days"].mean()), 2),
                "late_risk_rate": round(float(sub["Late_delivery_risk"].mean()) * 100, 1),
                "avg_resilience": round(float(sub["Resilience_Score"].mean()), 1)
            })
        logistics_summary.sort(key=lambda x: x["order_count"], reverse=True)
        self.logistics_cache = logistics_summary

    def get_overview(self):
        return self.overview_cache

    def get_risk_analytics(self):
        return self.risk_cache

    def get_resilience_analytics(self):
        return self.resilience_cache

    def get_suppliers(self, search: str = None, risk_filter: str = None):
        res = self.suppliers_cache
        if search:
            res = [s for s in res if search.lower() in s["Supplier_Name"].lower()]
        if risk_filter and risk_filter.upper() != "ALL":
            res = [s for s in res if s["risk_level"].upper() == risk_filter.upper()]
        return res

    def get_logistics(self):
        return self.logistics_cache

    def get_sample_orders(self, limit: int = 30, risk: str = None):
        df = self.df
        if risk and risk.upper() != "ALL":
            filtered = df[df["Supply_Risk_Category"].str.upper() == risk.upper()]
        else:
            filtered = df
        samples = filtered.head(limit).to_dict(orient="records")
        return samples

analytics_service = AnalyticsService()
