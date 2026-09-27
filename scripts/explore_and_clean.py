"""
Data Exploration, Quality Reporting, and Feature Transformation Pipeline.
Generates automated data-quality report and cleans the supply chain dataset.
"""
import os
import json
import logging
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RAW_PATH = Path("data/raw/supply_chain_raw.csv")
PROCESSED_DIR = Path("data/processed")
REPORTS_DIR = Path("reports")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def load_raw_dataset() -> pd.DataFrame:
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Raw data file not found at {RAW_PATH}. Please run download_dataset.py first.")
    
    logger.info(f"Loading raw dataset from {RAW_PATH}...")
    try:
        df = pd.read_csv(RAW_PATH, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(RAW_PATH, encoding="latin1")
    logger.info(f"Raw dataset loaded: {df.shape[0]:,} rows, {df.shape[1]} columns")
    return df

def generate_data_quality_report(df: pd.DataFrame) -> dict:
    logger.info("Generating automated data-quality audit...")
    total_rows = int(len(df))
    total_cols = int(df.shape[1])
    
    missing = df.isnull().sum()
    missing_dict = {col: {"count": int(count), "percent": round(float(count / total_rows) * 100, 2)}
                    for col, count in missing.items() if count > 0}
    
    duplicates = int(df.duplicated().sum())
    
    dtypes_count = df.dtypes.astype(str).value_counts().to_dict()
    
    # Numerical summaries
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    
    num_summary = {}
    outliers = {}
    for col in num_cols[:15]: # primary numerical features
        series = df[col].dropna()
        if len(series) > 0:
            q25 = float(series.quantile(0.25))
            q75 = float(series.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            n_outliers = int(((series < lower_bound) | (series > upper_bound)).sum())
            outliers[col] = {"outlier_count": n_outliers, "pct": round(n_outliers / total_rows * 100, 2)}
            
            num_summary[col] = {
                "mean": round(float(series.mean()), 2),
                "std": round(float(series.std()), 2),
                "min": round(float(series.min()), 2),
                "median": round(float(series.median()), 2),
                "max": round(float(series.max()), 2)
            }
            
    # Sample correlation matrix
    primary_num = [c for c in [
        "Days for shipping (real)", "Days for shipment (scheduled)", "Benefit per order",
        "Sales per customer", "Late_delivery_risk", "Order Item Discount Rate",
        "Order Item Profit Ratio", "Order Item Quantity", "Sales", "Product Price"
    ] if c in df.columns]
    
    corr_matrix = {}
    if primary_num:
        corr = df[primary_num].corr().round(3).to_dict()
        corr_matrix = corr

    report = {
        "dataset_name": "DataCo Smart Supply Chain Analysis",
        "total_records": total_rows,
        "total_columns": total_cols,
        "duplicate_rows": duplicates,
        "data_types": dtypes_count,
        "columns_with_missing_values": missing_dict,
        "numerical_column_count": len(num_cols),
        "categorical_column_count": len(cat_cols),
        "statistical_summary": num_summary,
        "outlier_analysis": outliers,
        "correlation_sample": corr_matrix
    }
    
    with open(REPORTS_DIR / "data_quality_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    # Write markdown summary
    with open(REPORTS_DIR / "data_quality_report.md", "w", encoding="utf-8") as f:
        f.write("# Automated Data Quality & Exploration Report\n\n")
        f.write(f"- **Total Records**: {total_rows:,}\n")
        f.write(f"- **Total Features**: {total_cols}\n")
        f.write(f"- **Duplicates Detected**: {duplicates}\n")
        f.write(f"- **Columns with Missing Values**: {len(missing_dict)}\n\n")
        f.write("## Missing Values Breakdown\n")
        if missing_dict:
            f.write("| Column | Missing Count | Missing Percentage |\n|---|---|---|\n")
            for col, d in missing_dict.items():
                f.write(f"| `{col}` | {d['count']} | {d['percent']}% |\n")
        else:
            f.write("No missing values found across primary columns.\n")
        f.write("\n## Primary Numerical Features Summary\n")
        f.write("| Feature | Mean | Std | Min | Median | Max |\n|---|---|---|---|---|---|\n")
        for col, s in num_summary.items():
            f.write(f"| `{col}` | {s['mean']} | {s['std']} | {s['min']} | {s['median']} | {s['max']} |\n")
            
    logger.info("Data quality report saved in reports/data_quality_report.json & .md")
    return report

def clean_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Performing feature engineering, risk classification, and resilience modeling...")
    
    # 1. Map Named Supplier Hubs for executive visibility
    vendor_prefixes = {
        "Apparel": "Apex Global Supply",
        "Fan Shop": "Beacon Logistics",
        "Golf": "Crestline Dist.",
        "Footwear": "Delta Pacific Sourcing",
        "Outdoors": "Echo Industrial",
        "Fitness": "Falcon Fulfillment"
    }
    
    dept_col = df["Department Name"].fillna("General")
    market_col = df["Market"].fillna("Global")
    
    supplier_names = []
    for dept, market in zip(dept_col, market_col):
        prefix = vendor_prefixes.get(dept, "Vanguard Partners")
        supplier_names.append(f"{prefix} [{dept} - {market}]")
    df["Supplier_Name"] = supplier_names

    # 2. Compute Lead Times & Delivery Delays
    real_days = df["Days for shipping (real)"].fillna(0).astype(float)
    sched_days = df["Days for shipment (scheduled)"].fillna(0).astype(float)
    delay_days = (real_days - sched_days).round(1)
    df["Actual_Shipping_Days"] = real_days
    df["Scheduled_Shipping_Days"] = sched_days
    df["Delay_Days"] = delay_days

    # 3. Formulate Defensible 3-Tier Risk Category
    # HIGH RISK: Canceled shipment, fraud/canceled status, or severe delay (>= 2 days)
    # MEDIUM RISK: Delay == 1 day, or orders on hold/pending/payment review, or negative profit ratio
    # LOW RISK: On time or advance delivery (delay <= 0), positive profit, completed order
    risk_categories = []
    delivery_status = df["Delivery Status"].fillna("Unknown")
    order_status = df["Order Status"].fillna("Unknown")
    profit_ratio = df["Order Item Profit Ratio"].fillna(0).astype(float)

    for del_stat, ord_stat, d_days, p_ratio in zip(delivery_status, order_status, delay_days, profit_ratio):
        if del_stat == "Shipping canceled" or ord_stat in ["CANCELED", "SUSPECTED_FRAUD"]:
            risk_categories.append("HIGH")
        elif d_days >= 2:
            risk_categories.append("HIGH")
        elif d_days == 1 or ord_stat in ["ON_HOLD", "PENDING", "PAYMENT_REVIEW"] or p_ratio < -0.15:
            risk_categories.append("MEDIUM")
        elif del_stat in ["Shipping on time", "Advance shipping"] and d_days <= 0 and ord_stat in ["COMPLETE", "CLOSED"]:
            risk_categories.append("LOW")
        else:
            risk_categories.append("MEDIUM")
            
    df["Supply_Risk_Category"] = risk_categories

    # 4. Supply Chain Resilience Score (0–100) Formulation
    # Component 1: Delivery Adherence (30%)
    adherence = np.where(delay_days <= 0, 1.0, np.where(delay_days == 1, 0.55, np.where(delay_days == 2, 0.30, 0.08)))
    adherence = np.where(delivery_status == "Shipping canceled", 0.05, adherence)

    # Component 2: Supplier Hub Historical Reliability (25%)
    hub_reliability_map = (df["Late_delivery_risk"] == 0).groupby(df["Supplier_Name"]).mean().to_dict()
    hub_rel = df["Supplier_Name"].map(hub_reliability_map).fillna(0.50).values

    # Component 3: Logistics Agility & Shipping Mode Flexibility (15%)
    mode_map = {"Same Day": 1.0, "First Class": 0.85, "Second Class": 0.70, "Standard Class": 0.55}
    shipping_mode = df["Shipping Mode"].fillna("Standard Class")
    logistics_agility = shipping_mode.map(mode_map).fillna(0.55).values

    # Component 4: Financial Margin Buffer Health (15%)
    margin_health = np.where(profit_ratio > 0.20, 1.0, np.where(profit_ratio >= 0.0, 0.75, np.where(profit_ratio >= -0.20, 0.40, 0.10)))

    # Component 5: Fulfillment Pipeline Stability (15%)
    status_map = {
        "COMPLETE": 1.0, "CLOSED": 1.0, "PROCESSING": 0.65,
        "PENDING": 0.60, "PENDING_PAYMENT": 0.60, "ON_HOLD": 0.35,
        "PAYMENT_REVIEW": 0.35, "CANCELED": 0.05, "SUSPECTED_FRAUD": 0.05
    }
    fulfillment_stability = order_status.map(status_map).fillna(0.50).values

    resilience_raw = (
        0.30 * adherence +
        0.25 * hub_rel +
        0.15 * logistics_agility +
        0.15 * margin_health +
        0.15 * fulfillment_stability
    ) * 100.0

    df["Resilience_Score"] = np.round(resilience_raw.clip(0, 100), 1)
    df["Resilience_Category"] = pd.cut(
        df["Resilience_Score"],
        bins=[-1, 44.9, 74.9, 100],
        labels=["LOW", "MODERATE", "HIGH"]
    ).astype(str)

    # 5. Inventory and Defect Metrics (Derived based on order dynamics)
    # Estimate stock buffer from order quantity and discount velocity
    order_qty = df["Order Item Quantity"].fillna(1).astype(int)
    discount_rate = df["Order Item Discount Rate"].fillna(0).astype(float)
    df["Order_Item_Quantity"] = order_qty
    df["Order_Item_Discount_Rate"] = discount_rate
    df["Product_Price"] = df["Product Price"].fillna(50.0).astype(float) if "Product Price" in df.columns else 50.0
    df["Sales_Per_Customer"] = df["Sales per customer"].fillna(df["Sales"]).astype(float)
    df["Benefit_Per_Order"] = df["Benefit per order"].fillna(df["Order Profit Per Order"]).astype(float)
    
    # 6. Select core clean feature set
    core_columns = [
        "Order Id", "Supplier_Name", "Category Name", "Customer Segment",
        "Department Name", "Market", "Order Region", "Shipping Mode",
        "Actual_Shipping_Days", "Scheduled_Shipping_Days", "Delay_Days",
        "Product_Price", "Order_Item_Quantity", "Sales_Per_Customer",
        "Benefit_Per_Order", "Order Item Profit Ratio", "Order_Item_Discount_Rate",
        "Late_delivery_risk", "Delivery Status", "Order Status",
        "Supply_Risk_Category", "Resilience_Score", "Resilience_Category"
    ]
    
    clean_df = df[core_columns].copy()
    clean_df.dropna(subset=["Supply_Risk_Category", "Resilience_Score"], inplace=True)
    
    # If dataset has > 60,000 rows, sample 50,000 stratified by risk category to ensure fast model training and snappy UI
    if len(clean_df) > 60000:
        logger.info(f"Subsampling 50,000 representative records with stratified distribution for performance...")
        sampled_df, _ = train_test_split(
            clean_df,
            train_size=50000,
            stratify=clean_df["Supply_Risk_Category"],
            random_state=42
        )
    else:
        sampled_df = clean_df

    output_path = PROCESSED_DIR / "supply_chain_clean.csv"
    sampled_df.to_csv(output_path, index=False)
    logger.info(f"Processed clean dataset saved: {output_path} ({len(sampled_df):,} records)")
    return sampled_df

if __name__ == "__main__":
    raw_df = load_raw_dataset()
    generate_data_quality_report(raw_df)
    clean_and_engineer_features(raw_df)
