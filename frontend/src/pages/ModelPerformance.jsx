import React, { useState, useEffect } from 'react';
import { Cpu, Award, CheckCircle, BarChart3, HelpCircle, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/model/performance');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed fetching model performance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#94a3b8' }}>
        Loading Model Governance & Explainability Data...
      </div>
    );
  }

  const { selected_model, selection_rationale, models_benchmarking, top_feature_importance, classes } = metrics;

  // Prepare feature importance for chart
  const featureChartData = Object.entries(top_feature_importance)
    .slice(0, 10)
    .map(([feat, score]) => ({
      feature: feat.replace(/_/g, ' '),
      importance: Number((score * 100).toFixed(2)),
    }));

  const selectedModelData = models_benchmarking[selected_model];
  const cm = selectedModelData?.confusion_matrix || [];

  return (
    <div className="app-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={24} color="#3b82f6" />
          Model Governance, Benchmarking & Explainability
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
          Comprehensive algorithmic audit comparing Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
        </p>
      </div>

      {/* Champion Model Banner */}
      <div
        className="content-card"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 58, 138, 0.2) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#3b82f6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Award size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Champion Model
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {selected_model} Classifier
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 14, lineHeight: 1.5, background: 'rgba(10, 14, 23, 0.5)', padding: 14, borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <strong>Selection Rationale:</strong> {selection_rationale}
        </p>
      </div>

      {/* Benchmarking Comparison Table */}
      <div className="content-card">
        <div className="card-header">
          <div>
            <div className="card-title">Model Benchmark Comparison</div>
            <div className="card-subtitle">Evaluation across cross-validation splits and test datasets</div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Accuracy</th>
                <th>Precision (Macro)</th>
                <th>Recall (Macro)</th>
                <th>F1-Score (Macro)</th>
                <th>F1 (Weighted)</th>
                <th>High-Risk Recall</th>
                <th>ROC-AUC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(models_benchmarking).map(([mName, mStats]) => {
                const isSelected = mName === selected_model;
                return (
                  <tr key={mName} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined }}>
                    <td style={{ fontWeight: 700, color: isSelected ? '#60a5fa' : '#fff' }}>
                      {mName}
                    </td>
                    <td>{(mStats.accuracy * 100).toFixed(1)}%</td>
                    <td>{(mStats.precision_macro * 100).toFixed(1)}%</td>
                    <td>{(mStats.recall_macro * 100).toFixed(1)}%</td>
                    <td>
                      <strong style={{ color: isSelected ? '#60a5fa' : '#fff' }}>
                        {(mStats.f1_macro * 100).toFixed(1)}%
                      </strong>
                    </td>
                    <td>{(mStats.f1_weighted * 100).toFixed(1)}%</td>
                    <td>
                      <strong style={{ color: '#ef4444' }}>
                        {(mStats.high_risk_recall * 100).toFixed(1)}%
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>
                        {mStats.roc_auc.toFixed(3)}
                      </strong>
                    </td>
                    <td>
                      {isSelected ? (
                        <span className="badge badge-blue">Champion</span>
                      ) : (
                        <span className="badge" style={{ background: '#1e293b', color: '#94a3b8' }}>Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* Feature Importance Chart */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">Top 10 Global Feature Importances</div>
              <div className="card-subtitle">Relative weight in predicting supply chain disruption risk</div>
            </div>
          </div>

          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={featureChartData} margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                <Tooltip
                  contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }}
                  formatter={(val) => [`${val}%`, 'Importance Weight']}
                />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Visualizer */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">Confusion Matrix ({selected_model})</div>
              <div className="card-subtitle">Predicted vs Actual Test Labels (N = 10,000)</div>
            </div>
          </div>

          {cm.length > 0 && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 8, textAlign: 'center', marginBottom: 6 }}>
                <div></div>
                {classes.map((cls) => (
                  <strong key={cls} style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Pred: {cls}</strong>
                ))}
              </div>

              {classes.map((trueCls, i) => (
                <div key={trueCls} style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right', paddingRight: 8 }}>
                    True: {trueCls}
                  </strong>
                  {cm[i]?.map((count, j) => {
                    const isDiagonal = i === j;
                    return (
                      <div
                        key={j}
                        style={{
                          background: isDiagonal ? '#10b98125' : '#1e293b60',
                          border: `1px solid ${isDiagonal ? '#10b98160' : '#1f293d'}`,
                          padding: '12px 6px',
                          borderRadius: 8,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isDiagonal ? '#10b981' : '#f8fafc' }}>
                          {count.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: isDiagonal ? '#10b981' : '#64748b' }}>
                          {isDiagonal ? 'CORRECT' : 'ERROR'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
