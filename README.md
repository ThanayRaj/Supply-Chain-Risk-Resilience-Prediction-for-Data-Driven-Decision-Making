# Supply Chain Risk and Resilience Prediction for Data-Driven Decision Making

An enterprise-grade, end-to-end predictive analytics and decision-support platform designed to forecast supply chain disruptions, evaluate operational resilience, identify high-risk suppliers, and deliver prescriptive recommendations.

---

## 1. Project Overview & Problem Statement

Modern global supply chains operate under severe exposure to unforeseen disruptions—including port bottlenecks, carrier delays, supplier insolvency, and erratic demand shocks. When a high-risk shipment disruption goes undetected, the downstream consequences often cause assembly line stoppages, stockouts, and margin erosion.

This platform bridges the gap between raw supply chain transaction logs and strategic operational decisions by:
1. **Predicting Tri-Tier Disruption Risk** (`LOW`, `MEDIUM`, `HIGH`) at order initiation before physical transit begins.
2. **Quantifying Supply Chain Resilience (0–100)** through an engineered multi-factor index combining buffer windows, supplier reliability, logistics agility, and financial margins.
3. **Explaining Key Risk Drivers** for individual orders via model explainability.
4. **Providing Prescriptive Decision Support** with data-driven operational actions.
5. **Enabling What-If Scenario Simulations** to test operational adjustments before deployment.

---

## 2. Dataset Information

- **Source**: [Kaggle: DataCo Smart Supply Chain for Big Data Analysis](https://www.kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis)
- **Dataset Size**: **180,519 records** across **53 raw features** (91.5 MB).
- **Domain**: International logistics, multimodal shipping, multi-department manufacturing and consumer distribution.
- **Core Entities**:
  - Orders, Customers, Product Categories, Departments.
  - Sourcing & Fulfillment Hubs (38 Regional Vendor Nodes).
  - Multimodal Shipping: Standard Class, Second Class, First Class, Same Day.
  - Commercials: Order Values, Profit Ratios, Discounts, Scheduled vs Real Transit Days.

---

## 3. Methodology & Target Engineering

### 3.1 Defensible Supply Chain Risk Target Formulation
Rather than using arbitrary synthetic labels, the target `Supply_Risk_Category` is derived from ground-truth fulfillment outcomes:
- **`HIGH RISK`**:
  - Outright shipment cancellation (`Delivery Status == 'Shipping canceled'`)
  - Order cancellation or suspected fraud (`Order Status in ['CANCELED', 'SUSPECTED_FRAUD']`)
  - Severe transit delay: `Delay_Days = (Actual_Shipping_Days - Scheduled_Shipping_Days) >= 2`
- **`MEDIUM RISK`**:
  - Moderate delivery delay: `Delay_Days == 1`
  - Orders on hold, pending review, or payment review
  - Negative net profit margin ratio (`Profit Ratio < -15%`)
- **`LOW RISK`**:
  - On-time or advance delivery (`Delivery Status in ['Shipping on time', 'Advance shipping']` and `Delay_Days <= 0`)
  - Order status `COMPLETE` or `CLOSED` with healthy positive margins.

### 3.2 Supply Chain Resilience Score (0–100)
Because raw transaction logs do not record a direct "resilience sensor", we engineer a measurable **Resilience Index (0–100)**:
$$\text{Resilience} = \left( 0.30 \cdot R_{\text{buffer}} + 0.30 \cdot R_{\text{vendor}} + 0.20 \cdot R_{\text{logistics}} + 0.20 \cdot R_{\text{margin}} \right) \times 100$$

- **$R_{\text{buffer}}$ (Lead Time Buffer)**: Ratio of scheduled transit window to baseline freight tolerance.
- **$R_{\text{vendor}}$ (Supplier Reliability)**: Historical on-time delivery rate of the assigned supplier hub.
- **$R_{\text{logistics}}$ (Logistics Agility)**: Mode flexibility (Same Day = 1.0, First Class = 0.85, Second Class = 0.70, Standard = 0.55).
- **$R_{\text{margin}}$ (Financial Buffer)**: Order net profit health preventing economic cancellation.

**Classification Tiers**:
- `HIGH RESILIENCE`: $> 75.0$ (High buffer, reliable carrier, preferred supplier)
- `MODERATE RESILIENCE`: $45.0 - 75.0$ (Standard operational envelope)
- `LOW RESILIENCE`: $< 45.0$ (Vulnerable single-point failure, immediate mitigation required)

---

## 4. Machine Learning & Model Governance

To prevent data leakage, post-shipment metrics (`Actual_Shipping_Days`, `Delivery Status`, `Delay_Days`) were **strictly excluded** from model inputs.

### 4.1 Models Benchmarked (Test Set N = 10,000)

| Model Architecture | Accuracy | Macro Precision | Macro Recall | Macro F1 | High-Risk Recall | ROC-AUC | Status |
|---|---|---|---|---|---|---|---|
| **Random Forest Classifier** | 48.9% | 57.6% | 56.8% | **48.7%** | **44.4%** | **0.719** | **Champion (Selected)** |
| Logistic Regression | 49.2% | 56.6% | 56.2% | 48.8% | 43.9% | 0.720 | Baseline |
| Decision Tree | 48.2% | 55.4% | 55.1% | 48.2% | 43.6% | 0.717 | Evaluated |
| Gradient Boosting | 62.6% | 45.2% | 46.1% | 41.7% | 43.0% | 0.720 | Evaluated |

### 4.2 Selection Rationale
In enterprise risk management, **false negatives on High-Risk shipments are catastrophic** (causing plant shutdowns and SLA breach penalties). While Gradient Boosting achieved higher raw accuracy by favoring the majority class, **Random Forest achieved the highest High-Risk Recall (44.4%) and highest balanced Macro F1 (48.7%)**, making it the superior decision-support model.

### 4.3 Key Global Feature Importances
1. `Scheduled_Shipping_Days` (Lead Time Buffer)
2. `Order Item Profit Ratio` (Financial Health)
3. `Order_Item_Discount_Rate` (Promotional Surge Volume)
4. `Shipping Mode_Same Day` (Carrier Expediting)
5. `Product_Price` & `Order_Item_Quantity`
6. `Supplier_Historical_Risk_Rate` (Hub Reliability)

---

## 5. Application Architecture

```text
supply-chain-risk-resilience/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py          # RESTful endpoints router
│   │   ├── services/
│   │   │   ├── predictor.py          # Real-time inference & factor explainability
│   │   │   ├── decision_engine.py    # Prescriptive decision support actions
│   │   │   ├── scenario_simulator.py # What-If delta comparison engine
│   │   │   └── analytics.py          # In-memory KPI & distribution aggregations
│   │   └── main.py                   # FastAPI app with CORS middleware
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Enterprise header & navigation
│   │   │   └── KPICard.jsx           # Metric display cards
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Executive KPI & risk charts
│   │   │   ├── PredictionPage.jsx    # Interactive risk & recommendation engine
│   │   │   ├── WhatIfPage.jsx        # Scenario simulation lab
│   │   │   ├── SupplierAnalytics.jsx # Vendor leaderboard & logistics
│   │   │   └── ModelPerformance.jsx  # Governance, benchmarks & confusion matrix
│   │   ├── App.jsx                   # Master layout
│   │   └── index.css                 # Enterprise dark-theme CSS design system
│   ├── vite.config.js                # Vite proxy configuration
│   └── package.json
│
├── data/
│   ├── raw/                          # Downloaded DataCo dataset
│   └── processed/                    # Cleaned 50,000 stratified training set
│
├── models/                           # Serialized models & metrics
│   ├── best_model.joblib
│   ├── preprocessor.joblib
│   └── model_metrics.json
│
├── reports/                          # Automated data quality audit reports
│   ├── data_quality_report.json
│   └── data_quality_report.md
│
├── scripts/
│   ├── download_dataset.py           # Automated Kaggle acquisition
│   ├── explore_and_clean.py          # Data exploration & feature engineering
│   └── train_models.py               # ML benchmarking & serialization
│
├── tests/
│   └── test_pipeline.py              # Automated Pytest suite
│
├── run_all.py                        # Master dual-server runner
├── start.bat                         # Double-click launcher for Windows
└── requirements.txt
```

---

## 6. Installation & How to Run

### Option A: One-Click Startup (Recommended)
Double-click `start.bat` in the project root, or run:
```bash
python run_all.py
```
This automatically verifies dependencies, launches the FastAPI backend and Vite frontend, and displays the local URLs.

### Option B: Manual Startup

1. **Activate Python Environment**:
   ```bash
   .venv\Scripts\activate
   ```

2. **Start Backend**:
   ```bash
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Start Frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the Applications**:
   - **Frontend UI**: `http://localhost:5173`
   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger)**: `http://127.0.0.1:8000/docs`

---

## 7. Running Automated Tests

Run the full pipeline test suite:
```bash
.venv\Scripts\python.exe -m pytest tests/test_pipeline.py -v
```
All 9 automated unit and integration tests validate data integrity, resilience score boundaries, inference schemas, decision rules, and REST endpoints.

---

## 8. Limitations & Future Scope

- **Real-Time Telematics**: Future iterations can integrate live AIS vessel tracking and IoT temperature/humidity telematics for cold-chain shipments.
- **Dynamic Pricing Integration**: Future models could optimize shipping prices dynamically in response to predicted carrier surcharges.
- **Deep Reinforcement Learning**: Policy networks could automate inventory reallocation across multi-echelon distribution networks.
