import React from 'react';
import { ShieldAlert, BarChart3, Sliders, Cpu, Activity, Truck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'predictor', label: 'Risk & Decision Engine', icon: ShieldAlert },
    { id: 'whatif', label: 'What-If Simulation Lab', icon: Sliders },
    { id: 'suppliers', label: 'Supplier & Logistics', icon: Truck },
    { id: 'model', label: 'ML Performance & Explainability', icon: Cpu },
  ];

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon">
          <Activity size={24} />
        </div>
        <div>
          <div className="brand-title">Supply Chain Risk & Resilience Intelligence</div>
          <div className="brand-subtitle">Data-Driven Decision Support System</div>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
