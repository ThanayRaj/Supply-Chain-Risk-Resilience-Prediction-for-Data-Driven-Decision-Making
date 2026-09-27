import React, { useState, useEffect } from 'react';
import { Truck, Search, Filter, ShieldCheck, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function SupplierAnalytics() {
  const [suppliers, setSuppliers] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resSuppliers, resLogistics] = await Promise.all([
          fetch('/api/analytics/suppliers').then((r) => r.json()),
          fetch('/api/analytics/logistics').then((r) => r.json()),
        ]);
        setSuppliers(resSuppliers);
        setLogistics(resLogistics);
      } catch (err) {
        console.error('Failed fetching supplier analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch = s.Supplier_Name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = riskFilter === 'ALL' || s.risk_level.toUpperCase() === riskFilter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#94a3b8' }}>
        Loading Supplier & Logistics Intelligence...
      </div>
    );
  }

  return (
    <div className="app-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={24} color="#3b82f6" />
          Supplier & Logistics Risk Analytics
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
          Comprehensive vendor reliability benchmarking, delay variance diagnostics, and carrier performance analytics across global fulfillment hubs.
        </p>
      </div>

      {/* Logistics Overview Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {logistics.slice(0, 3).map((item) => (
          <div key={item.shipping_mode} className="content-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{item.shipping_mode}</strong>
              <span className="badge badge-blue">{item.share_pct}% Volume</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.late_risk_rate > 50 ? '#ef4444' : '#10b981' }}>
              {item.late_risk_rate}%
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>Late Delivery Risk</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginTop: 8 }}>
              <span>Avg Delay: <strong style={{ color: item.avg_delay_days > 0 ? '#ef4444' : '#10b981' }}>{item.avg_delay_days > 0 ? `+${item.avg_delay_days}d` : `${item.avg_delay_days}d`}</strong></span>
              <span>Resilience: <strong style={{ color: '#10b981' }}>{item.avg_resilience} / 100</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Carrier Performance Comparison Chart */}
      <div className="content-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <BarChart2 size={20} color="#3b82f6" />
              Carrier Mode Lead Time Adherence
            </div>
            <div className="card-subtitle">Scheduled transit vs actual shipping days across logistics modes</div>
          </div>
        </div>
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer>
            <BarChart data={logistics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
              <XAxis dataKey="shipping_mode" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }} />
              <Legend />
              <Bar dataKey="avg_scheduled_days" name="Scheduled Days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_actual_days" name="Actual Days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_delay_days" name="Avg Delay (Days)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplier Leaderboard Table */}
      <div className="content-card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="card-title">Supplier Hub Risk & Resilience Leaderboard</div>
            <div className="card-subtitle">Ranked by proportion of high-risk shipments and historical delay days</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 34, width: 240 }}
                placeholder="Search supplier hub..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: 10, top: 12 }} />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((tier) => (
                <button
                  key={tier}
                  className={`btn-secondary ${riskFilter === tier ? 'active' : ''}`}
                  style={{
                    background: riskFilter === tier ? '#3b82f6' : undefined,
                    color: riskFilter === tier ? '#fff' : undefined,
                  }}
                  onClick={() => setRiskFilter(tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Sourcing Hub</th>
                <th>Total Orders</th>
                <th>High-Risk Shipments</th>
                <th>Disruption Rate (%)</th>
                <th>Avg Delay (Days)</th>
                <th>Avg Resilience Score</th>
                <th>Resilience Tier</th>
                <th>Operational Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{s.Supplier_Name}</td>
                  <td>{s.total_orders.toLocaleString()}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{s.high_risk_orders.toLocaleString()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.high_risk_pct > 30 ? '#ef4444' : s.high_risk_pct > 25 ? '#f59e0b' : '#10b981' }}>
                      {s.high_risk_pct}%
                    </span>
                  </td>
                  <td style={{ color: s.avg_delay > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {s.avg_delay > 0 ? `+${s.avg_delay}d` : `${s.avg_delay}d`}
                  </td>
                  <td>
                    <strong style={{ color: '#10b981' }}>{s.avg_resilience}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}> / 100</span>
                  </td>
                  <td>
                    <span className={`badge ${s.resilience_tier === 'HIGH' ? 'badge-low' : s.resilience_tier === 'MODERATE' ? 'badge-med' : 'badge-high'}`}>
                      {s.resilience_tier}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.risk_level === 'HIGH' ? 'badge-high' : s.risk_level === 'MODERATE' ? 'badge-med' : 'badge-low'}`}>
                      {s.risk_level} RISK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
