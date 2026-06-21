import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from '../context/AuthContext';
import { RiderDataProvider } from '../context/RiderDataContext';
import EarningsOverview from '../components/dashboard/EarningsOverview';
import WeeklyEarningsChart from '../components/dashboard/WeeklyEarningsChart';
import AIRiskMonitoring from '../components/dashboard/AIRiskMonitoring';
import SmartRelocation from '../components/dashboard/SmartRelocation';
import InsuranceWallet from '../components/dashboard/InsuranceWallet';
import MicroLoanAccess from '../components/dashboard/MicroLoanAccess';
import Notifications from '../components/dashboard/Notifications';
import DynamicPricing from '../components/dashboard/DynamicPricing';
import ClaimsCenter from '../components/dashboard/ClaimsCenter';
import LiveMap from '../components/dashboard/LiveMap';
import './UserDashboard.css';

const NAV_ITEMS = [
  { key: 'dashboard',  icon: '🏠', label: 'Dashboard'   },
  { key: 'earnings',   icon: '💰', label: 'Earnings'    },
  { key: 'insurance',  icon: '🛡️', label: 'Insurance'   },
  { key: 'claims',     icon: '📋', label: 'Claims'      },
  { key: 'loans',      icon: '💳', label: 'Loans'       },
  { key: 'risk',       icon: '📊', label: 'Risk & AI'   },
  { key: 'location',   icon: '📍', label: 'Live Map'    },
  { key: 'alerts',     icon: '🔔', label: 'Alerts'      },
];

function fade(delay) {
  return { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay } };
}

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const firstName        = user?.name?.split(' ')[0] || 'Rider';
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => { AOS.init({ duration: 700, once: true }); }, []);

  const scrollTo = (key) => {
    setActiveNav(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <RiderDataProvider>
      <div className="user-dashboard">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar__logo">
            <span>Rider Portal</span>
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
            <button className="dash-nav-item" onClick={() => navigate('/user-profile')}>
              <span className="nav-icon">👤</span> My Profile
            </button>
            <button className="dash-nav-item" onClick={() => navigate('/earnings-calendar')}>
              <span className="nav-icon">📅</span> Earnings Calendar
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
              <h1>Welcome back, {firstName}! 👋</h1>
              <p>Here's your ride summary for today</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-outline" onClick={() => navigate('/earnings-calendar')}>📅 Calendar</button>
              <button className="btn btn-outline" onClick={() => navigate('/user-profile')}>👤 Profile</button>
              <button className="btn btn-primary" onClick={logout}>Logout</button>
            </div>
          </motion.div>

          {/* ── SECTION: Dashboard — Stats ── */}
          <section id="section-dashboard">
            <motion.div className="dash-stats-row" {...fade(0.1)}>
              <EarningsOverview />
            </motion.div>
          </section>

          {/* ── SECTION: Earnings ── */}
          <section id="section-earnings">
            <motion.div className="dash-full-row" {...fade(0.15)}>
              <WeeklyEarningsChart />
            </motion.div>
          </section>

          {/* ── SECTION: Risk & AI ── */}
          <section id="section-risk">
            <motion.div className="dash-content-grid" {...fade(0.2)}>
              <AIRiskMonitoring />
              <SmartRelocation />
            </motion.div>
          </section>

          {/* ── SECTION: Insurance + Pricing ── */}
          <section id="section-insurance">
            <motion.div className="dash-content-grid" {...fade(0.25)}>
              <InsuranceWallet />
              <DynamicPricing />
            </motion.div>
          </section>

          {/* ── SECTION: Claims ── */}
          <section id="section-claims">
            <motion.div className="dash-full-row" {...fade(0.28)}>
              <ClaimsCenter />
            </motion.div>
          </section>

          {/* ── SECTION: Live Map ── */}
          <section id="section-location">
            <motion.div className="dash-full-row" {...fade(0.29)}>
              <LiveMap />
            </motion.div>
          </section>

          {/* ── SECTION: Loans + Alerts ── */}
          <section id="section-loans">
            <motion.div className="dash-content-grid" {...fade(0.3)}>
              <MicroLoanAccess />
              <div id="section-alerts">
                <Notifications />
              </div>
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
    </RiderDataProvider>
  );
}

export default UserDashboard;
