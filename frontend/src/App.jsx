import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PredictionPage from './pages/PredictionPage';
import WhatIfPage from './pages/WhatIfPage';
import SupplierAnalytics from './pages/SupplierAnalytics';
import ModelPerformance from './pages/ModelPerformance';
import { ShieldCheck, Database, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, paddingBottom: 40 }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'predictor' && <PredictionPage />}
        {activeTab === 'whatif' && <WhatIfPage />}
        {activeTab === 'suppliers' && <SupplierAnalytics />}
        {activeTab === 'model' && <ModelPerformance />}
      </main>

      {/* Enterprise Status Footer */}
      <footer style={{ borderTop: '1px solid #1f293d', padding: '16px 32px', background: '#0a0e17', fontSize: '0.8rem', color: '#64748b' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              FastAPI Engine Online
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Database size={14} /> DataCo Kaggle Dataset (180,519 records)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} /> Champion Model: Random Forest Classifier
            </span>
          </div>
          <div>
            Supply Chain Risk & Resilience Intelligence Platform &copy; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
