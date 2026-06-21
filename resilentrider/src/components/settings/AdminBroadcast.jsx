import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import './AdminBroadcast.css';

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const TYPE_ICON = {
  fraud: '🚨', error: '❌', claim: '📋', loan: '💰', payout: '💸',
  warning: '⚠️', success: '✅', system: '⚙️', weather: '🌦️', info: 'ℹ️',
};

const TYPES     = ['system', 'claim', 'fraud', 'loan', 'payout', 'warning', 'info'];
const PRIORITIES = ['low', 'medium', 'high'];
const FILTERS   = ['all', 'fraud', 'claim', 'system', 'payout'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminBroadcast() {
  const [form, setForm] = useState({ title: '', message: '', type: 'system', priority: 'low' });
  const [sending,   setSending]   = useState(false);
  const [sendMsg,   setSendMsg]   = useState(null);
  const [alerts,    setAlerts]    = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [filter,    setFilter]    = useState('all');
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchAlerts = useCallback(async (f = 'all') => {
    setLoadingAlerts(true);
    try {
      const { data } = await api.get(`/notifications/admin?limit=20&filter=${f}`);
      if (data.success) {
        setAlerts(data.data);
        setTypeCounts(data.typeCounts || {});
      }
    } catch {}
    finally { setLoadingAlerts(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleFilter = (f) => { setFilter(f); fetchAlerts(f); };

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setSendMsg({ text: 'Title and message are required', ok: false });
      setTimeout(() => setSendMsg(null), 3000);
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/notifications/broadcast', form);
      if (data.success) {
        setSendMsg({ text: `✅ Broadcast sent to ${data.count} riders`, ok: true });
        setForm({ title: '', message: '', type: 'system', priority: 'low' });
        fetchAlerts(filter);
      }
    } catch (err) {
      setSendMsg({ text: err?.response?.data?.message || 'Broadcast failed', ok: false });
    } finally {
      setSending(false);
      setTimeout(() => setSendMsg(null), 4000);
    }
  };

  return (
    <div className="ab-wrap">

      {/* ── Broadcast Panel ── */}
      <div className="card ab-card">
        <h3 className="profile-card-title">📡 Broadcast Notification</h3>
        <p className="profile-card-desc">Send a notification to all riders instantly.</p>

        {sendMsg && (
          <div className={`ab-flash ${sendMsg.ok ? 'ab-flash--ok' : 'ab-flash--err'}`}>
            {sendMsg.text}
          </div>
        )}

        <div className="ab-form">
          <div className="profile-field">
            <label className="profile-field__label">Title</label>
            <input
              className="profile-field__input"
              type="text"
              placeholder="Notification title…"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="profile-field">
            <label className="profile-field__label">Message</label>
            <textarea
              className="profile-field__input ab-textarea"
              placeholder="Notification message…"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="ab-form-row">
            <div className="profile-field">
              <label className="profile-field__label">Type</label>
              <select
                className="profile-field__input"
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Priority</label>
              <select
                className="profile-field__input"
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary ab-send-btn"
            onClick={handleBroadcast}
            disabled={sending}
          >
            {sending ? 'Sending…' : '📢 Send to All Users'}
          </button>
        </div>
      </div>

      {/* ── System Alert Monitor ── */}
      <div className="card ab-card">
        <div className="ab-monitor-header">
          <h3 className="profile-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>
            🔍 System Alert Monitor
          </h3>
          <button className="ab-refresh" onClick={() => fetchAlerts(filter)} title="Refresh">↻</button>
        </div>

        {/* Type count badges */}
        <div className="ab-counts">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="ab-count-badge">
              {TYPE_ICON[type] || '•'} {type} <strong>{count}</strong>
            </span>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="ab-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`nc-filter-btn ${filter === f ? 'nc-filter-btn--active' : ''}`}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="ab-list">
          {loadingAlerts && <p className="nc-empty">Loading…</p>}
          {!loadingAlerts && alerts.length === 0 && (
            <p className="nc-empty">No alerts found</p>
          )}
          <AnimatePresence initial={false}>
            {alerts.map(n => (
              <motion.div
                key={n._id}
                className={`ab-alert-item ab-alert-item--${n.priority}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <span className="ab-alert-icon">
                  {n.metadata?.icon || TYPE_ICON[n.type] || 'ℹ️'}
                </span>
                <div className="ab-alert-body">
                  <div className="ab-alert-top">
                    <span className="ab-alert-title">{n.title}</span>
                    <span
                      className="nc-item__priority"
                      style={{
                        background: `${PRIORITY_COLOR[n.priority] || '#6B7280'}18`,
                        color: PRIORITY_COLOR[n.priority] || '#6B7280',
                      }}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <p className="ab-alert-msg">{n.message}</p>
                  <div className="ab-alert-meta">
                    {n.userId?.name && <span className="ab-alert-user">👤 {n.userId.name}</span>}
                    <span className="nc-item__time">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
