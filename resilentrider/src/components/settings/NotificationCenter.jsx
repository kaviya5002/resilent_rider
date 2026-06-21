import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationCenter.css';

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const TYPE_ICON = {
  fraud: '🚨', error: '❌', claim: '📋', loan: '💰', payout: '💸',
  warning: '⚠️', success: '✅', system: '⚙️', weather: '🌦️', info: 'ℹ️',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FILTERS = [
  { key: 'all',    label: 'All'           },
  { key: 'unread', label: 'Unread'        },
  { key: 'high',   label: 'High Priority' },
];

export default function NotificationCenter() {
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification, fetchNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');

  const handleFilter = useCallback((key) => {
    setActiveFilter(key);
    fetchNotifications(key);
  }, [fetchNotifications]);

  const visible = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'high')   return n.priority === 'high';
    return true;
  });

  return (
    <div className="nc-card card">
      {/* Header */}
      <div className="nc-header">
        <div className="nc-header__left">
          <h3 className="profile-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>
            📌 Notification Center
          </h3>
          {unreadCount > 0 && (
            <span className="nc-badge">{unreadCount}</span>
          )}
        </div>
        <button
          className="nc-mark-all"
          onClick={markAllAsRead}
          style={{ display: unreadCount > 0 ? 'block' : 'none' }}
        >
          Mark all read
        </button>
      </div>

      {/* Filters */}
      <div className="nc-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`nc-filter-btn ${activeFilter === f.key ? 'nc-filter-btn--active' : ''}`}
            onClick={() => handleFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="nc-list">
        {loading && <p className="nc-empty">Loading…</p>}
        {!loading && visible.length === 0 && (
          <p className="nc-empty">No notifications</p>
        )}
        <AnimatePresence initial={false}>
          {visible.map(n => (
            <motion.div
              key={n._id}
              className={`nc-item ${!n.isRead ? 'nc-item--unread' : ''}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="nc-item__icon">
                {n.metadata?.icon || TYPE_ICON[n.type] || 'ℹ️'}
              </span>
              <div className="nc-item__body">
                <div className="nc-item__top">
                  <span className="nc-item__title">{n.title}</span>
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
                <p className="nc-item__message">{n.message}</p>
                <span className="nc-item__time">{timeAgo(n.createdAt)}</span>
              </div>
              <div className="nc-item__actions">
                {!n.isRead && (
                  <button
                    className="nc-action-btn nc-action-btn--read"
                    onClick={() => markAsRead(n._id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="nc-action-btn nc-action-btn--del"
                  onClick={() => deleteNotification(n._id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
