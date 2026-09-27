import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Package, Users, Truck, Search, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import KPICard from '../components/KPICard';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [sampleOrders, setSampleOrders] = useState([]);
  const [tableFilter, setTableFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resOverview, resRisk, resOrders] = await Promise.all([
          fetch('/api/overview').then((r) => r.json()),
          fetch('/api/analytics/risk').then((r) => r.json()),
          fetch('/api/data/sample?limit=50').then((r) => r.json()),
        ]);
        setOverview(resOverview);
        setRiskData(resRisk);
        setSampleOrders(resOrders);
      } catch (err) {
        console.error('Failed fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !overview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px' }}>Loading Supply Chain Intelligence...</div>
          <div style={{ fontSize: '0.85rem' }}>Aggregating 50,000 supply chain records & risk models</div>
        </div>
      </div>
    );
  }

  const { kpis, risk_distribution, resilience_distribution } = overview;

  const filteredOrders = sampleOrders.filter((order) => {
    const matchesFilter = tableFilter === 'ALL' || order.Supply_Risk_Category === tableFilter;
    const matchesSearch =
      order.Supplier_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order['Category Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order['Order Id']).includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="app-container">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Total Records Analyzed"
          value={kpis.total_records.toLocaleString()}
          subtext="DataCo Global Supply Chain"
          icon={Package}
          color="#3b82f6"
        />
        <KPICard
          title="High-Risk Shipments"
          value={kpis.high_risk_records.toLocaleString()}
          subtext={`${kpis.high_risk_percentage}% of total fulfillment`}
          icon={AlertTriangle}
          color="#ef4444"
          badge={{ text: 'Disruption Risk', type: 'badge-high' }}
        />
        <KPICard
          title="Average Risk Probability"
          value={`${kpis.average_risk_score}%`}
          subtext="Model-estimated delay exposure"
          icon={ShieldAlert}
          color="#f59e0b"
        />
        <KPICard
          title="Avg Resilience Score"
          value={`${kpis.average_resilience_score} / 100`}
          subtext="Supply chain buffer & recovery"
          icon={TrendingUp}
          color="#10b981"
          badge={{ text: 'Moderate Tier', type: 'badge-med' }}
        />
        <KPICard
          title="High-Risk Suppliers"
          value={kpis.high_risk_suppliers_count}
          subtext={`Across ${kpis.total_suppliers_count} total supplier hubs`}
          icon={Users}
          color="#ec4899"
        />
        <KPICard
          title="Potential Disruptions"
          value={kpis.potential_disruptions.toLocaleString()}
          subtext="Late delays (>=2 days) & cancellations"
          icon={Truck}
          color="#8b5cf6"
        />
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid-2">
        {/* Risk Distribution Chart */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldAlert size={20} color="#ef4444" />
                Supply Chain Risk Distribution
              </div>
              <div className="card-subtitle">Tri-tier classification: Low, Medium, and High Risk shipments</div>
            </div>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={risk_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }}
                  formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.percentage}%)`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value, entry) => <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resilience Index Distribution */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={20} color="#10b981" />
                Resilience Index Tiers (0–100)
              </div>
              <div className="card-subtitle">Engineered index of operational buffer, reliability, and logistics agility</div>
            </div>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={resilience_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }}
                  formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.percentage}%)`, 'Shipments']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {resilience_distribution.map((entry, index) => (
                    <Cell key={`res-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dimensional Breakdown: Risk by Department & Shipping Mode */}
      {riskData && (
        <div className="grid-2">
          <div className="content-card">
            <div className="card-header">
              <div>
                <div className="card-title">Risk by Product Department</div>
                <div className="card-subtitle">Proportion of High, Medium, and Low risk per category</div>
              </div>
            </div>
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={riskData.by_department}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="department" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" />
                  <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <div>
                <div className="card-title">Risk by Shipping Mode</div>
                <div className="card-subtitle">Transit method vulnerability analysis</div>
              </div>
            </div>
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={riskData.by_shipping_mode}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="shipping_mode" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', borderColor: '#1f293d', borderRadius: 8, color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="high" name="High Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medium" name="Medium Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" name="Low Risk" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Operational Orders Table */}
      <div className="content-card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="card-title">Operational Supply Chain Records</div>
            <div className="card-subtitle">Sample orders monitored in real-time with risk & resilience classification</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 34, width: 220 }}
                placeholder="Search supplier, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: 10, top: 12 }} />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  className={`btn-secondary ${tableFilter === lvl ? 'active' : ''}`}
                  style={{
                    background: tableFilter === lvl ? '#3b82f6' : undefined,
                    color: tableFilter === lvl ? '#fff' : undefined,
                  }}
                  onClick={() => setTableFilter(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Supplier Hub</th>
                <th>Category</th>
                <th>Shipping Mode</th>
                <th>Scheduled</th>
                <th>Actual</th>
                <th>Delay</th>
                <th>Risk Category</th>
                <th>Resilience</th>
                <th>Fulfillment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 15).map((order, idx) => {
                const badgeClass =
                  order.Supply_Risk_Category === 'HIGH'
                    ? 'badge-high'
                    : order.Supply_Risk_Category === 'MEDIUM'
                    ? 'badge-med'
                    : 'badge-low';

                const delayColor = order.Delay_Days > 0 ? '#ef4444' : order.Delay_Days === 0 ? '#10b981' : '#3b82f6';

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#60a5fa' }}>#{order['Order Id']}</td>
                    <td style={{ fontWeight: 500 }}>{order.Supplier_Name}</td>
                    <td>{order['Category Name']}</td>
                    <td>{order['Shipping Mode']}</td>
                    <td>{order.Scheduled_Shipping_Days}d</td>
                    <td>{order.Actual_Shipping_Days}d</td>
                    <td style={{ color: delayColor, fontWeight: 700 }}>
                      {order.Delay_Days > 0 ? `+${order.Delay_Days}d` : `${order.Delay_Days}d`}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{order.Supply_Risk_Category}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{order.Resilience_Score}</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}> / 100</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order['Delivery Status']}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
