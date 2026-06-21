import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MOCK_RIDERS } from '../../data/mockRiderData';
import './RiderAnalyticsTable.css';

// ── AI Risk level color ───────────────────────────────────────
const riskColor = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444' };

// ── Rider Detail Modal ────────────────────────────────────────
function RiderModal({ rider, onClose }) {
  if (!rider) return null;
  const healthScore = rider.riskScore;
  const healthLabel = healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Stable' : healthScore >= 40 ? 'Risky' : 'Critical';
  const healthColor = healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#3B82F6' : healthScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rider-modal"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-avatar">{rider.name[0]}</div>
          <div>
            <h3>{rider.name}</h3>
            <span style={{ fontSize: '0.8rem', color: '#3C5070' }}>{rider._id} · {rider.city}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Stats row */}
          <div className="modal-stats">
            {[
              { label: 'Deliveries',  value: rider.totalDeliveries.toLocaleString(), icon: '📦' },
              { label: 'Earnings',    value: `₹${rider.totalEarnings.toLocaleString()}`, icon: '💰' },
              { label: 'Claims',      value: rider.totalClaims, icon: '📋' },
              { label: 'Safety Score',value: `${rider.riskScore}/100`, icon: '🛡️' },
            ].map((s, i) => (
              <div key={i} className="modal-stat">
                <span className="modal-stat-icon">{s.icon}</span>
                <span className="modal-stat-value">{s.value}</span>
                <span className="modal-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="modal-cols">
            {/* Left — Personal Info */}
            <div className="modal-section">
              <p className="modal-section-title">Personal Info</p>
              {[
                ['Email',    rider.email],
                ['Phone',    rider.phone],
                ['City',     rider.city],
                ['Vehicle',  rider.vehicleType],
                ['Joined',   rider.joinedDate],
                ['Last Active', rider.lastActive],
              ].map(([k, v]) => (
                <div key={k} className="modal-row">
                  <span className="modal-key">{k}</span>
                  <span className="modal-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Right — Policy Info */}
            <div className="modal-section">
              <p className="modal-section-title">Policy Info</p>
              {[
                ['Plan',      rider.plan],
                ['Premium',   `₹${rider.premium}/week`],
                ['Coverage',  `₹${rider.coverageAmount.toLocaleString()}`],
                ['Status',    rider.policyStatus],
                ['Risk Level',rider.riskLevel],
              ].map(([k, v]) => (
                <div key={k} className="modal-row">
                  <span className="modal-key">{k}</span>
                  <span className="modal-val" style={k === 'Risk Level' ? { color: riskColor[v], fontWeight: 700 } : k === 'Status' ? { color: v === 'active' ? '#10B981' : '#EF4444', fontWeight: 700, textTransform: 'capitalize' } : {}}>{v}</span>
                </div>
              ))}

              {/* Policy Health */}
              <div style={{ marginTop: '1rem' }}>
                <p className="modal-section-title">Policy Health</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(17,34,80,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1 }}
                      style={{ height: '100%', background: healthColor, borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: healthColor }}>{healthLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="modal-section" style={{ marginTop: '1rem' }}>
            <p className="modal-section-title">Activity Timeline</p>
            <div className="modal-timeline">
              {[
                { icon: '✅', text: 'Policy Activated',    date: rider.joinedDate,   color: '#10B981' },
                { icon: '📦', text: `${rider.totalDeliveries} Deliveries Completed`, date: rider.lastActive, color: '#3B82F6' },
                rider.totalClaims > 0 && { icon: '📋', text: `${rider.totalClaims} Claim(s) Filed`, date: rider.lastActive, color: '#F59E0B' },
                rider.policyStatus === 'suspended' && { icon: '🚫', text: 'Policy Suspended', date: rider.lastActive, color: '#EF4444' },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="timeline-item">
                  <span className="timeline-dot" style={{ background: item.color }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#112250' }}>{item.text}</p>
                    <p style={{ fontSize: '0.72rem', color: '#6B7280' }}>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button className="btn btn-outline" style={{ fontSize: '0.82rem' }} onClick={onClose}>Close</button>
          <button className="btn btn-primary" style={{ fontSize: '0.82rem' }}
            onClick={() => { alert(`Sending message to ${rider.name}...`); }}>
            📧 Contact Rider
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RiderAnalyticsTable() {
  const [riders, setRiders]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [selectedRider, setSelectedRider] = useState(null);
  const pages = Math.ceil(total / 10) || 1;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/riders?page=${page}&limit=10&search=${search}`)
      .then((res) => {
        setRiders(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      })
      .catch(() => {
        const filtered = MOCK_RIDERS.filter(r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.city.toLowerCase().includes(search.toLowerCase())
        );
        setTotal(filtered.length);
        const start = (page - 1) * 10;
        setRiders(filtered.slice(start, start + 10));
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  const exportCSV = () => {
    const headers = ['Rider ID','Name','Email','Phone','City','Vehicle','Risk Level','Safety Score','Deliveries','Earnings (INR)','Claims','Plan','Premium','Coverage','Status','Joined','Last Active'];
    const rows = MOCK_RIDERS.map(r => [
      r._id, r.name, r.email, r.phone, r.city, r.vehicleType,
      r.riskLevel, r.riskScore, r.totalDeliveries, r.totalEarnings,
      r.totalClaims, r.plan, r.premium, r.coverageAmount,
      r.policyStatus, r.joinedDate, r.lastActive
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'resilentrider_riders.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':  return '#10B981';
      case 'warning': return '#F59E0B';
      default:        return '#6B7280';
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 95) return '#10B981';
    if (score >= 90) return '#3B82F6';
    if (score >= 85) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="rider-analytics-table">
      <div className="table-header">
        <h2 className="section-title">Rider Analytics</h2>
        <div className="table-actions">
          <input
            type="search"
            placeholder="Search riders..."
            className="search-input"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <button className="btn btn-outline" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Rider ID</th>
              <th>Name</th>
              <th>Deliveries</th>
              <th>Earnings</th>
              <th>Safety Score</th>
              <th>Claims</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', opacity: 0.6, padding: '1rem' }}>Loading...</td></tr>
            ) : riders.map((rider, index) => (
              <motion.tr
                key={rider._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="rider-id">{String(rider._id).slice(-6).toUpperCase()}</td>
                <td className="rider-name">{rider.name}</td>
                <td>{rider.totalDeliveries || 0}</td>
                <td className="earnings">₹{(rider.totalEarnings || 0).toLocaleString()}</td>
                <td>
                  <span
                    className="score-badge"
                    style={{
                      background: `${getSafetyScoreColor(rider.riskScore || 90)}20`,
                      color: getSafetyScoreColor(rider.riskScore || 90),
                    }}
                  >
                    {rider.riskScore || 90}
                  </span>
                </td>
                <td>
                  <span className={`claims-count ${(rider.totalClaims || 0) > 0 ? 'has-claims' : ''}`}>
                    {rider.totalClaims || 0}
                  </span>
                </td>
                <td>
                  <span className="status-indicator" style={{ background: getStatusColor(rider.policyStatus || 'active'), color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {rider.policyStatus || 'active'}
                  </span>
                </td>
                <td><button className="action-btn" onClick={() => setSelectedRider(rider)}>View</button></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="showing-text">Showing {riders.length} of {total} riders</span>
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
          {Array.from({ length: Math.min(3, pages) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))}>→</button>
        </div>
      </div>

      <AnimatePresence>
        <RiderModal rider={selectedRider} onClose={() => setSelectedRider(null)} />
      </AnimatePresence>
    </div>
  );
}

export default RiderAnalyticsTable;
