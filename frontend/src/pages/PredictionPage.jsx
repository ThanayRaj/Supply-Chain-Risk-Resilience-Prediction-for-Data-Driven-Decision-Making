import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Zap, Target, Lightbulb, Compass, Award } from 'lucide-react';

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    Scheduled_Shipping_Days: 2.0,
    'Shipping Mode': 'Standard Class',
    'Department Name': 'Apparel',
    Market: 'Europe',
    'Customer Segment': 'Consumer',
    Product_Price: 120.0,
    Order_Item_Quantity: 2,
    'Order Item Profit Ratio': 0.12,
    Order_Item_Discount_Rate: 0.05,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction once mounted if no result
  React.useEffect(() => {
    handleSubmit();
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="app-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Compass size={24} color="#3b82f6" />
          Interactive Risk Predictor & Decision Engine
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
          Input shipment parameters to generate real-time machine learning risk classification, resilience index diagnostics, and data-driven operational recommendations.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Form Inputs */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">Shipment & Operational Parameters</div>
              <div className="card-subtitle">Configure the order logistics and commercial profile</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Scheduled Days */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Scheduled Shipping Transit Days</label>
                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem' }}>
                  {formData.Scheduled_Shipping_Days} Days
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0"
                max="6"
                step="1"
                value={formData.Scheduled_Shipping_Days}
                onChange={(e) => handleChange('Scheduled_Shipping_Days', parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                <span>0d (Same-Day)</span>
                <span>2d (Fast)</span>
                <span>4d (Standard)</span>
                <span>6d (Relaxed)</span>
              </div>
            </div>

            {/* Shipping Mode & Department */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Shipping Carrier Tier</label>
                <select
                  className="form-control"
                  value={formData['Shipping Mode']}
                  onChange={(e) => handleChange('Shipping Mode', e.target.value)}
                >
                  <option value="Standard Class">Standard Class (Ground)</option>
                  <option value="Second Class">Second Class (Express)</option>
                  <option value="First Class">First Class (Priority Air)</option>
                  <option value="Same Day">Same Day Dispatch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Product Department</label>
                <select
                  className="form-control"
                  value={formData['Department Name']}
                  onChange={(e) => handleChange('Department Name', e.target.value)}
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Fan Shop">Fan Shop</option>
                  <option value="Golf">Golf</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Outdoors">Outdoors</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
            </div>

            {/* Market & Customer Segment */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Destination Market</label>
                <select
                  className="form-control"
                  value={formData.Market}
                  onChange={(e) => handleChange('Market', e.target.value)}
                >
                  <option value="Europe">Europe</option>
                  <option value="Pacific Asia">Pacific Asia</option>
                  <option value="USCA">USCA (North America)</option>
                  <option value="LATAM">LATAM (Latin America)</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Segment</label>
                <select
                  className="form-control"
                  value={formData['Customer Segment']}
                  onChange={(e) => handleChange('Customer Segment', e.target.value)}
                >
                  <option value="Consumer">Consumer B2C</option>
                  <option value="Corporate">Corporate B2B</option>
                  <option value="Home Office">Home Office</option>
                </select>
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Unit Product Price ($)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="2000"
                  value={formData.Product_Price}
                  onChange={(e) => handleChange('Product_Price', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="50"
                  value={formData.Order_Item_Quantity}
                  onChange={(e) => handleChange('Order_Item_Quantity', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Profit Margin Slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Net Profit Margin Ratio</label>
                <span style={{ color: formData['Order Item Profit Ratio'] < 0 ? '#ef4444' : '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                  {(formData['Order Item Profit Ratio'] * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="-0.30"
                max="0.40"
                step="0.05"
                value={formData['Order Item Profit Ratio']}
                onChange={(e) => handleChange('Order Item Profit Ratio', parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                <span>-30% (Severe Loss)</span>
                <span>0% (Break Even)</span>
                <span>+20% (Healthy)</span>
                <span>+40% (High Margin)</span>
              </div>
            </div>

            {/* Discount Rate Slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Promotional Discount Applied</label>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
                  {(formData.Order_Item_Discount_Rate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.0"
                max="0.25"
                step="0.02"
                value={formData.Order_Item_Discount_Rate}
                onChange={(e) => handleChange('Order_Item_Discount_Rate', parseFloat(e.target.value))}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              <Zap size={18} />
              {loading ? 'Evaluating Model Inference...' : 'Evaluate Risk & Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Prediction Results & Decision Support */}
        <div>
          {result && (
            <>
              {/* Risk & Resilience Score Header Card */}
              <div className="content-card" style={{ borderColor: result.predicted_risk === 'HIGH' ? 'rgba(239,68,68,0.5)' : result.predicted_risk === 'MEDIUM' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Predicted Risk Classification
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span className={`badge ${result.predicted_risk === 'HIGH' ? 'badge-high' : result.predicted_risk === 'MEDIUM' ? 'badge-med' : 'badge-low'}`} style={{ fontSize: '1.05rem', padding: '6px 16px' }}>
                        {result.predicted_risk === 'HIGH' ? <AlertTriangle size={18} /> : result.predicted_risk === 'MEDIUM' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                        {result.predicted_risk} RISK
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Disruption Probability: <strong style={{ color: '#fff' }}>{result.risk_score}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Resilience Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Resilience Index
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                        {result.resilience.score}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>/ 100</span>
                      <span className={`badge ${result.resilience.category === 'HIGH' ? 'badge-low' : result.resilience.category === 'MODERATE' ? 'badge-med' : 'badge-high'}`}>
                        {result.resilience.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Probability Bar */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6 }}>
                    <span>Low: {(result.risk_probabilities.LOW * 100).toFixed(1)}%</span>
                    <span>Medium: {(result.risk_probabilities.MEDIUM * 100).toFixed(1)}%</span>
                    <span>High: {(result.risk_probabilities.HIGH * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 10, background: '#1e293b', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${result.risk_probabilities.LOW * 100}%`, background: '#10b981' }} />
                    <div style={{ width: `${result.risk_probabilities.MEDIUM * 100}%`, background: '#f59e0b' }} />
                    <div style={{ width: `${result.risk_probabilities.HIGH * 100}%`, background: '#ef4444' }} />
                  </div>
                </div>

                {/* Resilience Components */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid #1f293d' }}>
                  {Object.entries(result.resilience.components).map(([k, v]) => (
                    <div key={k} style={{ background: '#0a0e17', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{v}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Explainability / Contributing Factors */}
              <div className="content-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <Lightbulb size={20} color="#f59e0b" />
                      Key Contributing Risk Factors
                    </div>
                    <div className="card-subtitle">Why did the {result.model_used} model make this prediction?</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.key_factors.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#0a0e17',
                        padding: '12px 14px',
                        borderRadius: 8,
                        borderLeft: `3px solid ${f.impact === 'HIGH' ? '#ef4444' : f.impact === 'MODERATE' ? '#f59e0b' : '#10b981'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{f.factor}</strong>
                        <span className={`badge ${f.impact === 'HIGH' ? 'badge-high' : f.impact === 'MODERATE' ? 'badge-med' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                          {f.impact} IMPACT
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                        {f.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision-Support Recommendations */}
              <div className="content-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <Award size={20} color="#3b82f6" />
                      Data-Driven Actionable Recommendations
                    </div>
                    <div className="card-subtitle">Prescriptive strategic decisions to mitigate disruption risk</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#162032',
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: '1px solid #1f293d',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa' }}>[{rec.category}]</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rec.title}</strong>
                        </div>
                        <span className={`badge ${rec.priority === 'HIGH' || rec.priority === 'CRITICAL' ? 'badge-high' : 'badge-med'}`} style={{ fontSize: '0.65rem' }}>
                          {rec.priority} PRIORITY
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 6, lineHeight: 1.4 }}>
                        {rec.action}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ArrowRight size={14} /> Expected Impact: {rec.impact}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 14, fontStyle: 'italic' }}>
                  * Data-Driven Operational Suggestion — evaluate in conjunction with real-time carrier capacity and local warehouse SLAs.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
