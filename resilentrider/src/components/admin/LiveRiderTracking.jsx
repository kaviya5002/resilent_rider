import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './LiveRiderTracking.css';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function LiveRiderTracking() {
  const [riders,  setRiders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetch = useCallback(() => {
    api.get('/admin/live-locations')
      .then(res => {
        if (res.data.success) {
          setRiders(res.data.data);
          setLastSync(new Date().toLocaleTimeString());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 15000); // refresh every 15s
    return () => clearInterval(t);
  }, [fetch]);

  return (
    <div className="live-tracking">
      <div className="lt-header">
        <h2 className="section-title">📡 Live Rider Tracking</h2>
        <div className="lt-meta">
          <span className="lt-dot" />
          <span className="lt-count">{riders.length} riders tracked</span>
          {lastSync && <span className="lt-sync">· {lastSync}</span>}
          <button className="lt-refresh" onClick={fetch}>↻</button>
        </div>
      </div>

      {loading && (
        <div className="lt-placeholder">
          <div className="lt-spinner" />
          <span>Fetching live locations…</span>
        </div>
      )}

      {!loading && riders.length === 0 && (
        <div className="lt-placeholder">
          No riders are currently being tracked. Location data will appear here once riders start sending GPS pings.
        </div>
      )}

      {!loading && riders.length > 0 && (
        <div className="lt-table-wrap">
          <table className="lt-table">
            <thead>
              <tr>
                {['Rider', 'Latitude', 'Longitude', 'Speed', 'Last Updated', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map((r, i) => {
                const age    = (Date.now() - new Date(r.lastUpdated)) / 1000;
                const isLive = age < 600; // active within 10 min
                return (
                  <motion.tr
                    key={String(r.userId)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={isLive ? 'lt-row--live' : ''}
                  >
                    <td className="lt-name">
                      <span className="lt-avatar">{r.name?.[0] || '?'}</span>
                      <div>
                        <p className="lt-name__text">{r.name}</p>
                        <p className="lt-name__email">{r.email}</p>
                      </div>
                    </td>
                    <td className="lt-coord">{r.latitude?.toFixed(5)}</td>
                    <td className="lt-coord">{r.longitude?.toFixed(5)}</td>
                    <td>{r.speed ? `${r.speed} km/h` : '—'}</td>
                    <td className="lt-time">{timeAgo(r.lastUpdated)}</td>
                    <td>
                      <span className={`lt-badge ${isLive ? 'lt-badge--live' : 'lt-badge--idle'}`}>
                        {isLive ? '🟢 Live' : '⚪ Idle'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LiveRiderTracking;
