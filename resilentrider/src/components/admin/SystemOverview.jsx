import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './SystemOverview.css';

const CARDS = [
  { key: 'totalRiders',       label: 'Total Riders',       icon: '🏍️', color: '#3B82F6' },
  { key: 'activeToday',       label: 'Active Today',        icon: '✅', color: '#10B981' },
  { key: 'liveTrackingUsers', label: 'Live Tracking',       icon: '📡', color: '#8B5CF6' },
  { key: 'claimsToday',       label: 'Claims Today',        icon: '📋', color: '#F59E0B' },
  { key: 'payoutsToday',      label: 'Payouts Today',       icon: '💰', color: '#10B981' },
  { key: 'fraudAlertsCount',  label: 'Fraud Alerts',        icon: '🚨', color: '#EF4444' },
];

function SystemOverview() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetch = useCallback(() => {
    api.get('/admin/system-overview')
      .then(res => {
        if (res.data.success) {
          setData(res.data.data);
          setLastSync(new Date().toLocaleTimeString());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, [fetch]);

  return (
    <div className="system-overview">
      <div className="so-header">
        <h2 className="section-title">📊 System Overview</h2>
        <div className="so-meta">
          <span className="so-live-dot" />
          <span className="so-sync">
            {loading ? 'Loading…' : lastSync ? `Synced ${lastSync}` : 'Live'}
          </span>
          <button className="so-refresh" onClick={fetch} title="Refresh">↻</button>
        </div>
      </div>

      <div className="so-grid">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            className="so-card"
            style={{ '--card-color': card.color }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <span className="so-card__icon">{card.icon}</span>
            <div className="so-card__body">
              <p className="so-card__label">{card.label}</p>
              <p className="so-card__value">
                {loading ? '—' : (data?.[card.key] ?? 0)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SystemOverview;
