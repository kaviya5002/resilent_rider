import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import './Notifications.css';

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const TYPE_BORDER    = {
  fraud: '#EF4444', error: '#EF4444',
  claim: '#3B82F6', loan: '#3B82F6',
  payout: '#10B981', success: '#10B981',
  warning: '#F59E0B', weather: '#F59E0B',
  system: '#6B7280', info: '#6B7280',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function groupByDate(notifs) {
  const groups = {};
  notifs.forEach(n => {
    const d   = new Date(n.createdAt);
    const now = new Date();
    let label;
    if (d.toDateString() === now.toDateString()) {
      label = 'Today';
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      label = d.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

export default function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread | high

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    if (filter === 'high')   return notifications.filter(n => n.priority === 'high');
    return notifications;
  }, [notifications, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="notifications">

      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header__left">
          <h2 className="section-title">🔔 Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={markAllAsRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notif-filters">
        {[
          { key: 'all',    label: 'All'         },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'high',   label: '🚨 High Priority' },
        ].map(f => (
          <button
            key={f.key}
            className={`notif-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="notifications-list">
        {loading && (
          <div className="notif-empty">Loading…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="notif-empty">
            <span>📭</span>
            <p>{filter === 'unread' ? 'All caught up!' : 'No notifications yet'}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="notif-date-label">{dateLabel}</div>
              {items.map((n, idx) => (
                <motion.div
                  key={n._id || idx}
                  className={`notification-item ${n.isRead ? 'read' : ''}`}
                  style={{ borderLeftColor: TYPE_BORDER[n.type] || '#6B7280' }}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="notification-icon">{n.icon || 'ℹ️'}</div>

                  <div className="notification-content">
                    <div className="notif-title-row">
                      <h4 className="notification-title">{n.title || n.message}</h4>
                      {n.priority && n.priority !== 'low' && (
                        <span
                          className="notif-priority-badge"
                          style={{ background: `${PRIORITY_COLOR[n.priority]}18`, color: PRIORITY_COLOR[n.priority] }}
                        >
                          {n.priority}
                        </span>
                      )}
                    </div>
                    {n.title && <p className="notification-message">{n.message}</p>}
                    <span className="notification-time">{timeAgo(n.createdAt)}</span>
                  </div>

                  {!n.isRead && <div className="unread-dot" />}
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
