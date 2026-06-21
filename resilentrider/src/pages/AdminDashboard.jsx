import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from '../context/AuthContext';
import AdminStats          from '../components/admin/AdminStats';
import PremiumPoolChart    from '../components/admin/PremiumPoolChart';
import ClaimsAnalytics     from '../components/admin/ClaimsAnalytics';
import FraudDetection      from '../components/admin/FraudDetection';
import RiderAnalyticsTable from '../components/admin/RiderAnalyticsTable';
import AIRiskPanel         from '../components/admin/AIRiskPanel';
import AdminClaimsPanel    from '../components/admin/AdminClaimsPanel';
import SystemOverview      from '../components/admin/SystemOverview';
import LiveRiderTracking   from '../components/admin/LiveRiderTracking';
import FraudDetectionPanel from '../components/admin/FraudDetectionPanel';
import PayoutMonitor       from '../components/admin/PayoutMonitor';
import AdminBroadcast      from '../components/admin/AdminBroadcast';
import './AdminDashboard.css';

const NAV_ITEMS = [
  { key: 'overview',   icon: '📊', label: 'Overview'   },
  { key: 'realtime',   icon: '📡', label: 'Real-Time'  },
  { key: 'analytics',  icon: '📈', label: 'Analytics'  },
  { key: 'riders',     icon: '🏍️', label: 'Riders'     },
  { key: 'claims',     icon: '📋', label: 'Claims'     },
  { key: 'payouts',    icon: '💰', label: 'Payouts'    },
  { key: 'fraud',      icon: '🔍', label: 'Fraud'      },
  { key: 'risk',       icon: '🤖', label: 'AI Risk'    },
  { key: 'broadcast',  icon: '📢', label: 'Broadcast'  },
];

function fade(delay) {
  return { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay } };
}

function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [activeNav, setActiveNav] = useState('overview');
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const adminName                 = user?.name?.split(' ')[0] || 'Admin';

  useEffect(() => { AOS.init({ duration: 700, once: true }); }, []);

  const scrollTo = (key) => {
    setActiveNav(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="admin-dashboard">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar__logo">
          <span>Admin Portal</span>
        </div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`dash-nav-item ${activeNav === item.key ? 'active' : ''}`}
            onClick={() => scrollTo(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="dash-sidebar__footer">
          <button className="dash-nav-item" onClick={() => navigate('/admin-profile')}>
            <span className="nav-icon">👤</span> My Profile
          </button>
          <button className="dash-nav-item" onClick={logout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="dash-main">

        {/* Header */}
        <motion.div className="dashboard-header" {...fade(0)}>
          <div className="header-content">
            <h1>Admin Dashboard 📊</h1>
            <p>Welcome, {adminName} — Insurance Provider Control Panel</p>
          </div>
          <div className="header-actions">
            <select className="time-range-select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn btn-outline" onClick={() => navigate('/admin-profile')}>My Profile</button>
            <button className="btn btn-primary" onClick={() => window.print()}>Generate Report</button>
          </div>
        </motion.div>

        {/* ── SECTION: Overview — Stats ── */}
        <section id="section-overview">
          <motion.div className="dash-full-row" {...fade(0.1)}>
            <AdminStats />
          </motion.div>
        </section>

        {/* ── SECTION: Real-Time Monitoring ── */}
        <section id="section-realtime">
          <motion.div className="dash-full-row" {...fade(0.12)}>
            <SystemOverview />
          </motion.div>
          <motion.div className="dash-full-row" {...fade(0.14)}>
            <LiveRiderTracking />
          </motion.div>
        </section>

        {/* ── SECTION: Analytics ── */}
        <section id="section-analytics">
          <motion.div className="dash-content-grid" {...fade(0.15)}>
            <PremiumPoolChart />
            <ClaimsAnalytics />
          </motion.div>
        </section>

        {/* ── SECTION: Riders ── */}
        <section id="section-riders">
          <motion.div className="dash-full-row" {...fade(0.2)}>
            <RiderAnalyticsTable />
          </motion.div>
        </section>

        {/* ── SECTION: Claims ── */}
        <section id="section-claims">
          <motion.div className="dash-full-row" {...fade(0.22)}>
            <AdminClaimsPanel />
          </motion.div>
        </section>

        {/* ── SECTION: Payouts ── */}
        <section id="section-payouts">
          <motion.div className="dash-full-row" {...fade(0.24)}>
            <PayoutMonitor />
          </motion.div>
        </section>

        {/* ── SECTION: Fraud ── */}
        <section id="section-fraud">
          <motion.div className="dash-content-grid" {...fade(0.25)}>
            <FraudDetectionPanel />
            <FraudDetection />
          </motion.div>
        </section>

        {/* ── SECTION: AI Risk ── */}
        <section id="section-risk">
          <motion.div className="dash-full-row" {...fade(0.27)}>
            <AIRiskPanel />
          </motion.div>
        </section>

        {/* ── SECTION: Broadcast ── */}
        <section id="section-broadcast">
          <motion.div className="dash-full-row" {...fade(0.29)}>
            <AdminBroadcast />
          </motion.div>
        </section>

      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="dash-mobile-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`mobile-nav-item ${activeNav === item.key ? 'active' : ''}`}
            onClick={() => scrollTo(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

    </div>
  );
}

export default AdminDashboard;
