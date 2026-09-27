"""
Multi-Model Training, Benchmarking, and Explainability Pipeline.
Trains and compares Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
Selects best model based on F1-score and High-Risk Recall.
"""
import os
import json
import logging
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_PATH = Path("data/processed/supply_chain_clean.csv")
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_and_evaluate_models():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Clean data not found at {DATA_PATH}. Run explore_and_clean.py first.")

    logger.info("Loading processed supply chain dataset...")
    df = pd.read_csv(DATA_PATH)
    logger.info(f"Loaded {len(df):,} records for training.")

    # Calculate historical supplier hub risk rates
    supplier_risk_rate = df.groupby("Supplier_Name")["Late_delivery_risk"].mean().to_dict()
    df["Supplier_Historical_Risk_Rate"] = df["Supplier_Name"].map(supplier_risk_rate).fillna(0.50)

    # Feature definitions (Preventing data leakage: do NOT include Actual Shipping Days or Delivery Status)
    numerical_features = [
        "Scheduled_Shipping_Days",
        "Product_Price",
        "Order_Item_Quantity",
        "Sales_Per_Customer",
        "Order Item Profit Ratio",
        "Order_Item_Discount_Rate",
        "Supplier_Historical_Risk_Rate"
    ]
    categorical_features = [
        "Shipping Mode",
        "Department Name",
        "Market",
        "Customer Segment"
    ]
    
    target_col = "Supply_Risk_Category"
    classes = ["LOW", "MEDIUM", "HIGH"]
    
    X = df[numerical_features + categorical_features].copy()
    y = df[target_col].copy()

    # Encode target labels
    le = LabelEncoder()
    le.fit(classes) # Force order: HIGH, LOW, MEDIUM
    y_encoded = le.transform(y)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )
    logger.info(f"Training set: {X_train.shape[0]:,} rows, Test set: {X_test.shape[0]:,} rows")

    # Build preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )

    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # Extract feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_["cat"]
    encoded_cat_features = cat_encoder.get_feature_names_out(categorical_features).tolist()
    all_feature_names = numerical_features + encoded_cat_features

    # Define candidate models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
        "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=42, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, class_weight="balanced", n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    }

    results = {}
    fitted_models = {}

    for name, clf in models.items():
        logger.info(f"Training {name}...")
        clf.fit(X_train_proc, y_train)
        fitted_models[name] = clf

        y_pred = clf.predict(X_test_proc)
        y_prob = clf.predict_proba(X_test_proc)

        acc = float(accuracy_score(y_test, y_pred))
        prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        
        # High-risk specific recall (Class HIGH)
        high_idx = list(le.classes_).index("HIGH")
        prec_per_class = precision_score(y_test, y_pred, average=None, zero_division=0).tolist()
        rec_per_class = recall_score(y_test, y_pred, average=None, zero_division=0).tolist()
        f1_per_class = f1_score(y_test, y_pred, average=None, zero_division=0).tolist()
        
        try:
            auc = float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted"))
        except Exception:
            auc = 0.0

        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "recall_macro": round(rec_macro, 4),
            "f1_macro": round(f1_macro, 4),
            "f1_weighted": round(f1_weighted, 4),
            "roc_auc": round(auc, 4),
            "high_risk_recall": round(rec_per_class[high_idx], 4),
            "high_risk_precision": round(prec_per_class[high_idx], 4),
            "high_risk_f1": round(f1_per_class[high_idx], 4),
            "per_class_metrics": {
                cls_name: {
                    "precision": round(prec_per_class[i], 4),
                    "recall": round(rec_per_class[i], 4),
                    "f1": round(f1_per_class[i], 4)
                } for i, cls_name in enumerate(le.classes_)
            },
            "confusion_matrix": cm
        }
        logger.info(f"-> {name} | Acc: {acc:.3f} | F1 (Macro): {f1_macro:.3f} | High-Risk Recall: {rec_per_class[high_idx]:.3f} | AUC: {auc:.3f}")

    # Select best model: Highest balanced combination of F1-macro and High-Risk Recall
    # In supply chain risk management, false negatives on high risk are extremely expensive.
    def score_model(m_name):
        res = results[m_name]
        return 0.5 * res["f1_macro"] + 0.5 * res["high_risk_recall"]

    best_model_name = max(results.keys(), key=score_model)
    best_model = fitted_models[best_model_name]
    logger.info(f"Selected Best Model: '{best_model_name}' (Score metric: {score_model(best_model_name):.4f})")

    # Extract Feature Importances
    feature_importance = {}
    if hasattr(best_model, "feature_importances_"):
        raw_importances = best_model.feature_importances_
        for feat_name, imp in zip(all_feature_names, raw_importances):
            feature_importance[feat_name] = round(float(imp), 4)
    elif hasattr(best_model, "coef_"):
        # For logistic regression, take mean absolute coefficient across classes
        mean_coef = np.mean(np.abs(best_model.coef_), axis=0)
        for feat_name, imp in zip(all_feature_names, mean_coef):
            feature_importance[feat_name] = round(float(imp), 4)

    # Sort feature importance
    sorted_importances = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    top_importances = dict(sorted_importances[:20])

    # Save artifacts
    joblib.dump(best_model, MODELS_DIR / "best_model.joblib")
    joblib.dump(preprocessor, MODELS_DIR / "preprocessor.joblib")
    
    selection_rationale = (
        f"{best_model_name} was chosen as the champion model because it provides the highest "
        f"balanced trade-off between Macro F1-score ({results[best_model_name]['f1_macro']:.3f}) and "
        f"critical High-Risk Recall ({results[best_model_name]['high_risk_recall']:.3f}). In supply chain "
        f"operations, missing an imminent disruption (false negative) causes catastrophic line stoppages "
        f"and stockouts, making high recall on high-risk shipments paramount over raw accuracy alone."
    )

    metadata = {
        "selected_model": best_model_name,
        "selection_rationale": selection_rationale,
        "classes": list(le.classes_),
        "numerical_features": numerical_features,
        "categorical_features": categorical_features,
        "all_feature_names": all_feature_names,
        "models_benchmarking": results,
        "top_feature_importance": top_importances,
        "supplier_risk_rate_map": supplier_risk_rate
    }

    with open(MODELS_DIR / "model_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Model artifacts successfully exported to {MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
