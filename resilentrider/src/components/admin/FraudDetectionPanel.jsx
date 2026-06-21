import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './FraudDetectionPanel.css';

function scoreColor(score) {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F59E0B';
  return '#10B981';
}

function FraudDetectionPanel() {
  const [riders,  setRiders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetch = useCallback(() => {
    api.get('/admin/fraud-detection')
      .then(res => { if (res.data.success) setRiders(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="fdp">
      <div className="fdp-header">
        <h2 className="section-title">🚨 Fraud Detection</h2>
        <div className="fdp-meta">
          <span className="fdp-count"
            style={{ background: riders.length ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                     color: riders.length ? '#EF4444' : '#10B981' }}>
            {riders.length} suspect{riders.length !== 1 ? 's' : ''}
          </span>
          <button className="fdp-refresh" onClick={fetch}>↻</button>
        </div>
      </div>

      {loading && (
        <div className="fdp-placeholder">
          <div className="fdp-spinner" /><span>Scanning for fraud…</span>
        </div>
      )}

      {!loading && riders.length === 0 && (
        <div className="fdp-placeholder fdp-placeholder--clean">
          ✅ No suspicious activity detected. All fraud scores are within safe range.
        </div>
      )}

      {!loading && riders.length > 0 && (
        <div className="fdp-list">
          {riders.map((rider, i) => {
            const color = scoreColor(rider.maxFraudScore);
            const isHigh = rider.maxFraudScore >= 80;
            return (
              <motion.div
                key={String(rider.userId)}
                className={`fdp-card ${isHigh ? 'fdp-card--high' : ''}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                {/* Rider row */}
                <div className="fdp-card__top">
                  <div className="fdp-card__left">
                    <span className="fdp-avatar" style={{ borderColor: color }}>
                      {rider.name?.[0] || '?'}
                    </span>
                    <div>
                      <p className="fdp-name">{rider.name}</p>
                      <p className="fdp-email">{rider.email}</p>
                    </div>
                  </div>
                  <div className="fdp-card__right">
                    <div className="fdp-score-wrap">
                      <span className="fdp-score-label">Fraud Score</span>
                      <span className="fdp-score-value" style={{ color }}>
                        {rider.maxFraudScore}
                      </span>
                    </div>
                    <span className="fdp-risk-badge"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {rider.maxFraudScore >= 80 ? '🔴 HIGH RISK' : '🟡 MEDIUM'}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="fdp-bar-track">
                  <motion.div
                    className="fdp-bar-fill"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${rider.maxFraudScore}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07 }}
                  />
                </div>

                {/* Last location */}
                {rider.lastLocation && (
                  <p className="fdp-location">
                    📍 Last seen: {rider.lastLocation.latitude?.toFixed(4)}, {rider.lastLocation.longitude?.toFixed(4)}
                    <span className="fdp-location__time">
                      · {new Date(rider.lastLocation.lastUpdated).toLocaleTimeString()}
                    </span>
                  </p>
                )}

                {/* Expand claims */}
                <button
                  className="fdp-toggle"
                  onClick={() => setExpanded(expanded === String(rider.userId) ? null : String(rider.userId))}
                >
                  {expanded === String(rider.userId) ? '▲ Hide' : `▼ View ${rider.claims.length} claim${rider.claims.length !== 1 ? 's' : ''}`}
                </button>

                {expanded === String(rider.userId) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="fdp-claims"
                  >
                    {rider.claims.map((c, ci) => (
                      <div key={String(c.claimId)} className="fdp-claim-row">
                        <span className="fdp-claim-type">{c.claimType?.replace('_', ' ')}</span>
                        <span className="fdp-claim-amount">₹{c.amount?.toLocaleString()}</span>
                        <span className="fdp-claim-score" style={{ color: scoreColor(c.fraudScore) }}>
                          Score: {c.fraudScore}
                        </span>
                        <span className="fdp-claim-status"
                          style={{ color: c.status === 'fraud_suspected' ? '#EF4444' : '#F59E0B' }}>
                          {c.status?.replace('_', ' ')}
                        </span>
                        <span className="fdp-claim-date">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FraudDetectionPanel;
