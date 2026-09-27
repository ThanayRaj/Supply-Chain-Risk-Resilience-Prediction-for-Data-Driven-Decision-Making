import React, { useState, useEffect } from 'react';
import { Sliders, ArrowRight, TrendingDown, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function WhatIfPage() {
  const defaultBaseline = {
    Scheduled_Shipping_Days: 1.0,
    'Shipping Mode': 'Standard Class',
    'Department Name': 'Apparel',
    Market: 'Europe',
    'Customer Segment': 'Consumer',
    Product_Price: 150.0,
    Order_Item_Quantity: 3,
    'Order Item Profit Ratio': -0.10,
    Order_Item_Discount_Rate: 0.15,
  };

  const [simulated, setSimulated] = useState({
    ...defaultBaseline,
    Scheduled_Shipping_Days: 3.0,
    'Shipping Mode': 'Second Class',
    'Order Item Profit Ratio': 0.15,
    Order_Item_Discount_Rate: 0.05,
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline: defaultBaseline,
          modified: simulated,
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [simulated]);

  const handleSimChange = (field, val) => {
    setSimulated((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="app-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sliders size={24} color="#3b82f6" />
          What-If Scenario Simulation Lab
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
          Simulate operational interventions (e.g. extending scheduled buffer days, upgrading carrier tiers, adjusting discount caps) and evaluate their real-time impact on risk de-escalation and resilience gain.
        </p>
      </div>

      {/* Simulation Result Shift Banner */}
      {simulationResult && (
        <div
          className="content-card"
          style={{
            background: simulationResult.deltas.resilience_score_delta >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: simulationResult.deltas.resilience_score_delta >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: simulationResult.deltas.resilience_score_delta >= 0 ? '#10b98120' : '#ef444420',
                  color: simulationResult.deltas.resilience_score_delta >= 0 ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {simulationResult.deltas.resilience_score_delta >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {simulationResult.deltas.shift_summary}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                  Risk Category Shift: <strong>{simulationResult.deltas.risk_category_shift}</strong> | Disruption Delta: <strong>{simulationResult.deltas.high_risk_prob_delta_pct > 0 ? `+${simulationResult.deltas.high_risk_prob_delta_pct}%` : `${simulationResult.deltas.high_risk_prob_delta_pct}%`}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Resilience Score Delta</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: simulationResult.deltas.resilience_score_delta >= 0 ? '#10b981' : '#ef4444' }}>
                  {simulationResult.deltas.resilience_score_delta > 0 ? `+${simulationResult.deltas.resilience_score_delta}` : simulationResult.deltas.resilience_score_delta} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      <div className="grid-2">
        {/* Baseline Scenario (Locked) */}
        <div className="content-card" style={{ opacity: 0.9 }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: '#94a3b8' }}>Baseline Operational Scenario</div>
              <div className="card-subtitle">Default order characteristics prior to intervention</div>
            </div>
            <span className="badge badge-high">CURRENT STATE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0e17', borderRadius: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scheduled Transit Days:</span>
              <strong style={{ color: '#fff' }}>{defaultBaseline.Scheduled_Shipping_Days} Day (Aggressive)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0e17', borderRadius: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Shipping Carrier Tier:</span>
              <strong style={{ color: '#fff' }}>{defaultBaseline['Shipping Mode']}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0e17', borderRadius: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Net Profit Margin:</span>
              <strong style={{ color: '#ef4444' }}>{(defaultBaseline['Order Item Profit Ratio'] * 100).toFixed(0)}% (Negative)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0e17', borderRadius: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Promotional Discount:</span>
              <strong style={{ color: '#f59e0b' }}>{(defaultBaseline.Order_Item_Discount_Rate * 100).toFixed(0)}%</strong>
            </div>

            {simulationResult && (
              <div style={{ marginTop: 16, padding: '16px', background: '#162032', borderRadius: 10, border: '1px solid #1f293d' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Baseline Diagnostics</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: simulationResult.baseline.predicted_risk === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                    {simulationResult.baseline.predicted_risk} RISK
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                    Resilience: {simulationResult.baseline.resilience.score} / 100
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modified What-If Scenario (Interactive Controls) */}
        <div className="content-card" style={{ borderColor: '#3b82f6' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: '#60a5fa' }}>Simulated Intervention Scenario</div>
              <div className="card-subtitle">Adjust variables to test mitigation effectiveness</div>
            </div>
            <span className="badge badge-blue">WHAT-IF STATE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Scheduled Days Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Adjust Scheduled Transit Buffer</label>
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>{simulated.Scheduled_Shipping_Days} Days</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0"
                max="5"
                step="1"
                value={simulated.Scheduled_Shipping_Days}
                onChange={(e) => handleSimChange('Scheduled_Shipping_Days', parseFloat(e.target.value))}
              />
            </div>

            {/* Carrier Tier */}
            <div>
              <label className="form-label" style={{ marginBottom: 4 }}>Upgrade Shipping Mode</label>
              <select
                className="form-control"
                value={simulated['Shipping Mode']}
                onChange={(e) => handleSimChange('Shipping Mode', e.target.value)}
              >
                <option value="Standard Class">Standard Class (Ground)</option>
                <option value="Second Class">Second Class (Expedited)</option>
                <option value="First Class">First Class (Priority Air)</option>
                <option value="Same Day">Same Day Dispatch</option>
              </select>
            </div>

            {/* Profit Margin */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Enforce Net Margin Target</label>
                <span style={{ color: simulated['Order Item Profit Ratio'] < 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {(simulated['Order Item Profit Ratio'] * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="-0.20"
                max="0.35"
                step="0.05"
                value={simulated['Order Item Profit Ratio']}
                onChange={(e) => handleSimChange('Order Item Profit Ratio', parseFloat(e.target.value))}
              />
            </div>

            {/* Discount Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Cap Promotional Discount</label>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  {(simulated.Order_Item_Discount_Rate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.0"
                max="0.25"
                step="0.02"
                value={simulated.Order_Item_Discount_Rate}
                onChange={(e) => handleSimChange('Order_Item_Discount_Rate', parseFloat(e.target.value))}
              />
            </div>

            {simulationResult && (
              <div style={{ marginTop: 10, padding: '16px', background: '#0f172a', borderRadius: 10, border: '1px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 600 }}>Simulated Outcome</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span className={`badge ${simulationResult.simulated.predicted_risk === 'HIGH' ? 'badge-high' : simulationResult.simulated.predicted_risk === 'MEDIUM' ? 'badge-med' : 'badge-low'}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
                    {simulationResult.simulated.predicted_risk} RISK
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    Resilience: {simulationResult.simulated.resilience.score} / 100
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
