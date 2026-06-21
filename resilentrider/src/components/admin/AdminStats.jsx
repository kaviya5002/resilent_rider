import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './AdminStats.css';

function AdminStats() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    {
      label: 'Total Riders Enrolled',
      value: data.totalRiders.toLocaleString(),
      change: `${data.activePlans} active plans`,
      trend: 'up',
      icon: '👥',
      color: '#3B82F6',
    },
    {
      label: 'Total Premium Collected',
      value: `₹${data.totalPremiumCollected.toLocaleString()}`,
      change: `${data.activePlans} active plans`,
      trend: 'up',
      icon: '💰',
      color: '#10B981',
    },
    {
      label: 'Claims Paid',
      value: `₹${data.totalClaimsPaid.toLocaleString()}`,
      change: `${data.pendingClaims} pending`,
      trend: 'neutral',
      icon: '📋',
      color: '#F59E0B',
    },
    {
      label: 'Risk Pool Balance',
      value: `₹${data.riskPoolBalance.toLocaleString()}`,
      change: `${data.fraudAlerts} fraud alerts`,
      trend: data.riskPoolBalance > 0 ? 'up' : 'down',
      icon: '🏦',
      color: '#8B5CF6',
    },
  ] : [];

  if (loading) {
    return <div className="admin-stats"><p style={{ opacity: 0.6, padding: '1rem' }}>Loading stats...</p></div>;
  }

  return (
    <div className="admin-stats">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="admin-stat-card"
            style={{ '--accent-color': stat.color }}
            whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(17, 34, 80, 0.15)' }}
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="stat-icon-wrapper">
              <span className="stat-icon">{stat.icon}</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <span className={`stat-change ${stat.trend}`}>
                {stat.trend === 'up' && '↑ '}
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AdminStats;
