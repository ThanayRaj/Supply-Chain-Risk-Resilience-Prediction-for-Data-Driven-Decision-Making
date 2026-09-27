import React from 'react';

export default function KPICard({ title, value, subtext, icon: Icon, color = '#3b82f6', badge }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon-wrap" style={{ background: `${color}1A`, color: color }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
        <span className="kpi-subtext">{subtext}</span>
        {badge && <span className={`badge ${badge.type}`}>{badge.text}</span>}
      </div>
    </div>
  );
}
