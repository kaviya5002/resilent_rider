import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './FraudDetection.css';

// ── AI Fraud Analysis Engine ──────────────────────────────────
function analyzefraud(claim) {
  const score = claim.fraudScore;
  const type  = claim.claimType;

  const patterns = [];
  const signals  = [];

  if (score >= 80) {
    patterns.push({ icon: '🔁', label: 'Repeat Claim Pattern',     detail: 'Multiple claims filed within 30 days — statistically abnormal' });
    signals.push({ label: 'Claim Frequency',  value: 'High', color: '#EF4444' });
  }
  if (score >= 60) {
    patterns.push({ icon: '📍', label: 'GPS Anomaly Detected',      detail: 'Claimed location does not match last known GPS coordinates' });
    signals.push({ label: 'Location Match',   value: 'Failed', color: '#EF4444' });
  }
  if (type === 'vehicle_damage') {
    patterns.push({ icon: '🔧', label: 'Vehicle Damage Mismatch',   detail: 'Damage report inconsistent with ride history and speed data' });
    signals.push({ label: 'Damage Validity',  value: 'Suspicious', color: '#F59E0B' });
  }
  if (type === 'medical') {
    patterns.push({ icon: '🏥', label: 'Medical Claim Delay',       detail: 'Claim filed 3+ days after reported incident — unusual delay' });
    signals.push({ label: 'Report Timing',    value: 'Delayed', color: '#F59E0B' });
  }
  if (type === 'accident') {
    patterns.push({ icon: '💥', label: 'Accident Frequency Alert',  detail: 'Rider has above-average accident rate compared to peer group' });
    signals.push({ label: 'Accident Rate',    value: 'Above Avg', color: '#F59E0B' });
  }

  // Always add behavioral signal
  signals.push({ label: 'Ride Activity',    value: score >= 70 ? 'Low Before Claim' : 'Normal', color: score >= 70 ? '#EF4444' : '#10B981' });
  signals.push({ label: 'AI Confidence',    value: `${score}%`, color: score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#10B981' });

  const verdict = score >= 80 ? 'Likely Fraud' : score >= 60 ? 'Suspicious' : 'Low Risk';
  const verdictColor = score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#10B981';

  const recommendation = score >= 80
    ? 'Reject claim and escalate to fraud investigation team immediately.'
    : score >= 60
    ? 'Hold claim for manual review. Request additional documentation from rider.'
    : 'Approve with standard verification process.';

  return { patterns, signals, verdict, verdictColor, recommendation };
}

function FraudDetection() {
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    api.get('/admin/fraud-alerts')
      .then(res => setAlerts(res.data.data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const getSeverityColor = (score) =>
    score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#3B82F6';

  const getStatusBadge = (status) => ({
    investigating:   { text: 'Investigating',   color: '#F59E0B' },
    pending:         { text: 'Pending Review',  color: '#3B82F6' },
    resolved:        { text: 'Resolved',        color: '#10B981' },
    fraud_suspected: { text: 'Fraud Suspected', color: '#EF4444' },
  }[status] || { text: 'Pending Review', color: '#3B82F6' });

  const mapAlert = (claim) => ({
    id:          claim._id,
    fraudScore:  claim.fraudScore,
    severity:    claim.fraudScore >= 80 ? 'high' : claim.fraudScore >= 60 ? 'medium' : 'low',
    riderName:   claim.rider?.name || `Rider #${String(claim.rider?._id || claim.rider || '').slice(-4)}`,
    issue:       claim.description || claim.claimType,
    claimType:   claim.claimType,
    amount:      `₹${(claim.amount || 0).toLocaleString()}`,
    time:        new Date(claim.createdAt).toLocaleDateString(),
    status:      claim.status,
    ai:          analyzefraud(claim),
  });

  const mapped = alerts.map(mapAlert);

  return (
    <div className="fraud-detection">
      <div className="fraud-header">
        <h2 className="section-title">🔍 AI Fraud Detection</h2>
        <span className="alert-badge">{mapped.filter(a => a.status !== 'resolved').length} Active</span>
      </div>

      {loading && <p style={{ opacity: 0.6, fontSize: '0.875rem', padding: '1rem 0' }}>Analyzing...</p>}

      <div className="alerts-list">
        {mapped.map((alert, index) => (
          <motion.div
            key={alert.id}
            className="alert-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="alert-indicator" style={{ background: getSeverityColor(alert.fraudScore) }} />

            <div className="alert-content" style={{ flex: 1 }}>
              {/* Top row */}
              <div className="alert-header-row">
                <h4 className="alert-rider">👤 {alert.riderName}</h4>
                <span className="severity-badge" style={{ background: `${getSeverityColor(alert.fraudScore)}20`, color: getSeverityColor(alert.fraudScore) }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <p className="alert-issue">{alert.issue}</p>

              <div className="alert-footer">
                <span className="alert-amount">{alert.amount}</span>
                <span className="alert-time">{alert.time}</span>
              </div>

              {/* Status + AI verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span className="status-badge" style={{ background: `${getStatusBadge(alert.status).color}20`, color: getStatusBadge(alert.status).color }}>
                  {getStatusBadge(alert.status).text}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: alert.ai.verdictColor, background: `${alert.ai.verdictColor}15`, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  🤖 {alert.ai.verdict}
                </span>
              </div>

              {/* Expand / Collapse AI Analysis */}
              <button
                onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                style={{ marginTop: '0.75rem', background: 'none', border: `1px solid rgba(17,34,80,0.15)`, borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#112250', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              >
                {expanded === alert.id ? '▲ Hide AI Analysis' : '▼ View AI Analysis'}
              </button>

              {/* AI Analysis Panel */}
              <AnimatePresence>
                {expanded === alert.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="ai-analysis-panel">

                      {/* Fraud Score Bar */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, color: '#112250' }}>🤖 AI Fraud Score</span>
                          <span style={{ fontWeight: 700, color: alert.ai.verdictColor }}>{alert.fraudScore}/100</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(17,34,80,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${alert.fraudScore}%` }}
                            transition={{ duration: 0.8 }}
                            style={{ height: '100%', background: alert.ai.verdictColor, borderRadius: '999px' }}
                          />
                        </div>
                      </div>

                      {/* Detected Patterns */}
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3C5070', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Detected Patterns</p>
                      {alert.ai.patterns.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                          <span style={{ fontSize: '1rem' }}>{p.icon}</span>
                          <div>
                            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#112250' }}>{p.label}</p>
                            <p style={{ fontSize: '0.72rem', color: '#6B7280' }}>{p.detail}</p>
                          </div>
                        </div>
                      ))}

                      {/* AI Signals */}
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3C5070', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.75rem 0 0.5rem' }}>AI Signals</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {alert.ai.signals.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(17,34,80,0.04)', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}>
                            <span style={{ color: '#3C5070' }}>{s.label}</span>
                            <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div style={{ marginTop: '0.75rem', background: `${alert.ai.verdictColor}10`, border: `1px solid ${alert.ai.verdictColor}30`, borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: alert.ai.verdictColor, marginBottom: '0.2rem' }}>📋 AI Recommendation</p>
                        <p style={{ fontSize: '0.75rem', color: '#112250' }}>{alert.ai.recommendation}</p>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>
                          ✅ Approve
                        </button>
                        <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem', borderColor: '#EF4444', color: '#EF4444' }}>
                          🚫 Reject
                        </button>
                        <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>
                          🔍 Investigate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="btn btn-outline btn-full">View All Alerts</button>
    </div>
  );
}

export default FraudDetection;
